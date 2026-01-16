import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  useCaseMessages,
  useCaseSuggestions,
  useConsultationDraft,
  useCreateDoctorPatient,
  useCreateMedicalCaseFromConsultation,
  useDoctorPatients,
  useSendConsultationMessage,
  useUpdateConsultationDraft,
} from '../api/queries'
import { ChatMessage } from './ChatMessage'
import { Card } from './Card'
import { CaseBuilderPanel } from './CaseBuilderPanel'

export function DoctorWorkspace({ consultationId }: { consultationId?: string }) {
  const navigate = useNavigate()
  const { caseId } = useParams()
  const activeId = consultationId ?? caseId
  const { data: messages } = useCaseMessages(activeId)
  const { data: suggestion } = useCaseSuggestions(activeId)
  const { data: draft } = useConsultationDraft(activeId)
  const { data: patients } = useDoctorPatients()
  const createPatient = useCreateDoctorPatient()
  const updateDraft = useUpdateConsultationDraft()
  const sendMessage = useSendConsultationMessage()
  const createCase = useCreateMedicalCaseFromConsultation()

  const groupedMessages = useMemo(() => messages ?? [], [messages])

  const [input, setInput] = useState('')

  return (
    <div className="grid grid-cols-3 gap-5">
      <div className="col-span-2 space-y-4">
        <Card
          title="问诊对话"
          action={<span className="text-xs text-slate-500">来源标注：规则 / RAG / 模型</span>}
        >
          <div className="flex flex-col gap-3">
            {groupedMessages.map((m) => (
              <ChatMessage key={m.id} message={m} />
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-slate-100 bg-white/70 p-3">
            <div className="flex items-end gap-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={2}
                placeholder="输入医生追问或患者补充（Enter 发送，Shift+Enter 换行）"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    if (!activeId) return
                    const content = input.trim()
                    if (!content) return
                    sendMessage.mutate({ consultationId: activeId, content })
                    setInput('')
                  }
                }}
                className="min-h-[52px] flex-1 resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              />
              <button
                type="button"
                disabled={!activeId || input.trim().length === 0 || sendMessage.isPending}
                onClick={() => {
                  if (!activeId) return
                  const content = input.trim()
                  if (!content) return
                  sendMessage.mutate({ consultationId: activeId, content })
                  setInput('')
                }}
                className="h-[52px] rounded-2xl bg-primary-600 px-5 text-sm font-semibold text-white shadow-soft-card transition hover:bg-primary-700 disabled:opacity-60"
              >
                发送
              </button>
            </div>
          </div>
        </Card>
      </div>
      <div className="space-y-4">
        <Card title="病例构建器" action={<span className="text-xs text-slate-500">候选点击即确认</span>}>
          {!draft || !activeId ? (
            <div className="text-slate-600">正在加载草稿...</div>
          ) : (
            <CaseBuilderPanel
              consultationId={activeId}
              draft={draft}
              patients={patients ?? []}
              suggestion={suggestion}
              saving={updateDraft.isPending}
              writing={createCase.isPending}
              onCreatePatient={(input) => createPatient.mutateAsync(input)}
              onSaveDraft={async (next) => {
                await updateDraft.mutateAsync({
                  consultationId: activeId,
                  patch: {
                    patientId: next.patientId,
                    symptoms: next.symptoms,
                    diagnosis: next.diagnosis,
                    formulaName: next.formulaName,
                    formulaDetail: next.formulaDetail,
                    usageNote: next.usageNote,
                    note: next.note,
                    status: next.status,
                  },
                })
              }}
              onWriteCase={async () => {
                try {
                  const created = await createCase.mutateAsync({ consultationId: activeId })
                  navigate(`/doctor/cases/${created.id}`)
                } catch (e) {
                  const message = e instanceof Error ? e.message : '写入失败'
                  window.alert(message)
                }
              }}
            />
          )}
        </Card>
      </div>
    </div>
  )
}
