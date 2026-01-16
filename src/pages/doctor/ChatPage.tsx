import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useCaseMessages,
  useCaseSuggestions,
  useConsultationDraft,
  useCreateConsultation,
  useCreateDoctorPatient,
  useCreateMedicalCaseFromConsultation,
  useDoctorPatients,
  useSendConsultationMessage,
  useUpdateConsultationDraft,
} from '../../api/queries'
import { Card } from '../../components/Card'
import { CaseChatBubble } from '../../components/CaseChatBubble'
import { CaseBuilderPanel } from '../../components/CaseBuilderPanel'
import { SourcePreviewModal } from '../../components/SourcePreviewModal'
import { consultationGuideMessage } from '../../lib/consultationGuide'
import type { Citation } from '../../types'

const lastConsultationStorageKey = 'doctor:lastConsultationId'

export function ChatPage() {
  const navigate = useNavigate()
  const [input, setInput] = useState('')
  const [pending, setPending] = useState(false)
  const [consultationId, setConsultationId] = useState<string | null>(null)
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null)

  const { data: patients } = useDoctorPatients()
  const createConsultation = useCreateConsultation()
  const createPatient = useCreateDoctorPatient()
  const { data: messages } = useCaseMessages(consultationId ?? undefined)
  const { data: suggestion } = useCaseSuggestions(consultationId ?? undefined)
  const { data: draft } = useConsultationDraft(consultationId ?? undefined)
  const updateDraft = useUpdateConsultationDraft()
  const sendMessage = useSendConsultationMessage()
  const createCase = useCreateMedicalCaseFromConsultation()

  const bottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!consultationId) return
    localStorage.setItem(lastConsultationStorageKey, consultationId)
  }, [consultationId])

  useEffect(() => {
    if (consultationId) return
    const last = localStorage.getItem(lastConsultationStorageKey)
    if (last) {
      setConsultationId(last)
      return
    }
    if (createConsultation.isPending) return
    void createConsultation.mutateAsync(undefined).then((res) => {
      setConsultationId(res.consultationId)
    })
  }, [consultationId, createConsultation])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages?.length])

  const canSend = useMemo(() => input.trim().length > 0 && !pending, [input, pending])
  const transcript = useMemo(() => messages ?? [], [messages])

  const send = async () => {
    const content = input.trim()
    if (!content || pending) return
    if (!consultationId) return

    setInput('')
    setPending(true)
    try {
      await sendMessage.mutateAsync({ consultationId, content })
    } finally {
      setPending(false)
    }
  }

  const startNew = async () => {
    if (createConsultation.isPending) return
    setPending(false)
    setInput('')
    try {
      const res = await createConsultation.mutateAsync(undefined)
      setConsultationId(res.consultationId)
    } catch {
      // ignore
    }
  }

  return (
    <div className="grid flex-1 min-h-0 grid-cols-5 gap-5">
      <div className="col-span-4 flex min-h-0 flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white/70 shadow-soft-card">
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="mx-auto w-full max-w-6xl">
            <div className="relative">
              <div className="flex w-full max-w-3xl flex-col gap-4 lg:mx-auto">
                <CaseChatBubble message={consultationGuideMessage} onOpenCitation={(c) => setSelectedCitation(c)} />
                {transcript.map((m) => (
                  <CaseChatBubble
                    key={m.id}
                    message={m}
                    onOpenCitation={(c) => setSelectedCitation(c)}
                  />
                ))}
                {pending ? (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
                      正在思考...
                    </div>
                  </div>
                ) : null}
                <div ref={bottomRef} />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 bg-white/80 px-6 py-4 backdrop-blur">
          <div className="mx-auto flex w-full max-w-3xl items-stretch gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  void send()
                }
              }}
              rows={2}
              disabled={!consultationId}
              placeholder={consultationId ? '输入患者描述（Enter 发送，Shift+Enter 换行）' : '正在创建问诊...'}
              className="min-h-[52px] flex-1 resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 disabled:bg-slate-50 disabled:text-slate-500"
            />
            <button
              type="button"
              onClick={() => void send()}
              disabled={!consultationId || !canSend}
              className="min-h-[52px] w-28 self-stretch rounded-2xl bg-primary-600 text-sm font-semibold text-white shadow-soft-card transition hover:bg-primary-700 disabled:opacity-60"
            >
              发送
            </button>
            <button
              type="button"
              onClick={() => void startNew()}
              disabled={createConsultation.isPending}
              className="min-h-[52px] w-28 self-stretch rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              开启新问诊
            </button>
          </div>
        </div>
      </div>

      <div className="col-span-1 flex min-h-0 flex-col">
        <Card title="病例记录" className="flex-1 min-h-0 flex flex-col" bodyClassName="flex-1 min-h-0 overflow-y-auto">
          {!consultationId || !draft ? (
            <div className="text-sm text-slate-600">正在加载...</div>
          ) : (
            <CaseBuilderPanel
              consultationId={consultationId}
              draft={draft}
              patients={patients ?? []}
              suggestion={suggestion}
              saving={updateDraft.isPending}
              writing={createCase.isPending}
              onCreatePatient={(input) => createPatient.mutateAsync(input)}
              onSaveDraft={async (next) => {
                await updateDraft.mutateAsync({
                  consultationId,
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
                const created = await createCase.mutateAsync({ consultationId })
                navigate(`/doctor/cases/${created.id}`)
              }}
            />
          )}
        </Card>
      </div>

      <SourcePreviewModal open={Boolean(selectedCitation)} citation={selectedCitation} onClose={() => setSelectedCitation(null)} />
    </div>
  )
}
