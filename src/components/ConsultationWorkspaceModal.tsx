import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
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
import type { Citation } from '../types'
import { Card } from './Card'
import { CaseChatBubble } from './CaseChatBubble'
import { CaseBuilderPanel } from './CaseBuilderPanel'
import { SourcePreviewModal } from './SourcePreviewModal'
import { consultationGuideMessage } from '../lib/consultationGuide'

export function ConsultationWorkspaceModal({
  open,
  consultationId,
  readOnly,
  title,
  onClose,
}: {
  open: boolean
  consultationId: string | null
  readOnly: boolean
  title?: string
  onClose: () => void
}) {
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null)

  const { data: patients } = useDoctorPatients()
  const createPatient = useCreateDoctorPatient()
  const { data: messages } = useCaseMessages(consultationId ?? undefined)
  const { data: suggestion } = useCaseSuggestions(consultationId ?? undefined)
  const { data: draft } = useConsultationDraft(consultationId ?? undefined)
  const updateDraft = useUpdateConsultationDraft()
  const sendMessage = useSendConsultationMessage()
  const createCase = useCreateMedicalCaseFromConsultation()

  const [input, setInput] = useState('')
  const [pending, setPending] = useState(false)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  const canSend = useMemo(() => input.trim().length > 0 && !pending, [input, pending])

  useEffect(() => {
    if (!open) return
    if (!consultationId) return
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [consultationId, messages?.length, open])

  if (!open || !consultationId) return null
  if (typeof document === 'undefined') return null

  const send = async () => {
    if (readOnly) return
    const content = input.trim()
    if (!content || pending) return

    setInput('')
    setPending(true)
    try {
      await sendMessage.mutateAsync({ consultationId, content })
      bottomRef.current?.scrollIntoView({ block: 'end' })
    } finally {
      setPending(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <button type="button" onClick={onClose} className="absolute inset-0 bg-black/30" aria-label="关闭问诊" />
      <div className="relative flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{title ?? (readOnly ? '问诊查看（只读）' : '问诊查看')}</p>
            <p className="truncate text-xs text-slate-500">{consultationId}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            关闭
          </button>
        </div>

        <div className="grid flex-1 min-h-0 grid-cols-5 gap-5 bg-slate-50 p-5">
          <div className="col-span-4 flex min-h-0 flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white/80 shadow-soft-card">
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="mx-auto w-full max-w-6xl">
                <div className="relative">
	                  <div className="flex w-full max-w-3xl flex-col gap-4 lg:mx-auto">
	                    <CaseChatBubble key="guide" message={consultationGuideMessage} onOpenCitation={(c) => setSelectedCitation(c)} />
	                    {(messages ?? []).map((m) => (
	                      <CaseChatBubble key={m.id} message={m} onOpenCitation={(c) => setSelectedCitation(c)} />
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
                  disabled={readOnly}
                  placeholder={readOnly ? '管理端不允许继续问诊' : '输入患者描述（Enter 发送，Shift+Enter 换行）'}
                  className="min-h-[52px] flex-1 resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 disabled:bg-slate-50 disabled:text-slate-500"
                />
                <button
                  type="button"
                  onClick={() => void send()}
                  disabled={readOnly || !canSend}
                  className="min-h-[52px] w-28 self-stretch rounded-2xl bg-primary-600 text-sm font-semibold text-white shadow-soft-card transition hover:bg-primary-700 disabled:opacity-60"
                >
                  发送
                </button>
              </div>
            </div>
          </div>

          <div className="col-span-1 flex min-h-0 flex-col">
            <Card
              title="病例记录"
              className="flex-1 min-h-0 flex flex-col"
              bodyClassName="flex-1 min-h-0 overflow-y-auto"
            >
              {!draft ? (
                <div className="text-sm text-slate-600">正在加载...</div>
              ) : (
                <CaseBuilderPanel
                  consultationId={consultationId}
                  draft={draft}
                  patients={patients ?? []}
                  suggestion={suggestion}
                  saving={updateDraft.isPending}
                  writing={createCase.isPending}
                  readOnly={readOnly}
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
                    if (readOnly) return
                    await createCase.mutateAsync({ consultationId })
                  }}
                />
              )}
            </Card>
          </div>
        </div>
      </div>

      <SourcePreviewModal open={Boolean(selectedCitation)} citation={selectedCitation} onClose={() => setSelectedCitation(null)} />
    </div>,
    document.body,
  )
}
