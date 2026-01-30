import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  useCaseMessages,
  useCaseSuggestions,
  useCatalog,
  useConsultationAdoptedSummaryStream,
  useConsultationDecisionStream,
  useConsultationDraft,
  useCreateDoctorPatient,
  useDoctorPatients,
  useSendConsultationMessage,
  useUpdateConsultationDraft,
} from '../api/queries'
import type { Citation, CaseMessage, Disease } from '../types'
import { Card } from './Card'
import { CaseChatBubble } from './CaseChatBubble'
import { CaseBuilderModal } from './CaseBuilderModal'
import { CaseBuilderPanel } from './CaseBuilderPanel'
import { SourcePreviewModal } from './SourcePreviewModal'
import { consultationGuideMessage } from '../lib/consultationGuide'
import { ConsultationCandidatePanel } from './ConsultationCandidatePanel'
import { dedupeSymptoms, readReasoningConfirmedSymptoms, writeReasoningConfirmedSymptoms } from '../lib/reasoningStorage'
import {
  extractAssistantContent,
  extractAssistantCreatedAt,
  normalizeDialoguePayload,
} from '../lib/consultationStream'

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
  const [casePanelOpen, setCasePanelOpen] = useState(false)

  const { data: patients } = useDoctorPatients()
  const { data: catalog } = useCatalog()
  const createPatient = useCreateDoctorPatient()
  const { data: messages } = useCaseMessages(consultationId ?? undefined, {
    enabled: Boolean(consultationId) && open,
    refetchOnMount: 'always',
  })
  const { data: suggestion } = useCaseSuggestions(consultationId ?? undefined, {
    enabled: Boolean(consultationId) && open,
    refetchOnMount: 'always',
  })
  const { data: draft } = useConsultationDraft(consultationId ?? undefined)
  const updateDraft = useUpdateConsultationDraft()
  const sendMessage = useSendConsultationMessage()
  const decisionStream = useConsultationDecisionStream()
  const adoptedSummaryStream = useConsultationAdoptedSummaryStream()
  const [reasoningConfirmedSymptoms, setReasoningConfirmedSymptoms] = useState<string[]>([])
  const [decisionStreamingMessage, setDecisionStreamingMessage] = useState<CaseMessage | null>(null)
  const [decisionPending, setDecisionPending] = useState(false)
  const [adoptedStreamingMessage, setAdoptedStreamingMessage] = useState<CaseMessage | null>(null)
  const [adoptedPending, setAdoptedPending] = useState(false)
  const [adoptedUserMessages, setAdoptedUserMessages] = useState<CaseMessage[]>([])
  const suggestedSymptoms = useMemo(() => {
    if (reasoningConfirmedSymptoms.length > 0) return reasoningConfirmedSymptoms
    return suggestion?.confirmedSymptoms ?? []
  }, [reasoningConfirmedSymptoms, suggestion?.confirmedSymptoms])

  const [input, setInput] = useState('')
  const [pending, setPending] = useState(false)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  const canSend = useMemo(() => input.trim().length > 0 && !pending, [input, pending])
  const caseBuilder = !consultationId || !draft ? (
    <div className="text-sm text-slate-600">正在加载...</div>
  ) : (
    <CaseBuilderPanel
      consultationId={consultationId}
      draft={draft}
      patients={patients ?? []}
      suggestedSymptoms={suggestedSymptoms}
      saving={updateDraft.isPending}
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
    />
  )
  const transcript = useMemo(() => {
    return (messages ?? [])
      .concat(adoptedUserMessages)
      .concat(decisionStreamingMessage && decisionStreamingMessage.content ? [decisionStreamingMessage] : [])
      .concat(adoptedStreamingMessage ? [adoptedStreamingMessage] : [])
      .slice()
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  }, [adoptedStreamingMessage, adoptedUserMessages, decisionStreamingMessage, messages])

  useEffect(() => {
    setReasoningConfirmedSymptoms([])
    setDecisionStreamingMessage(null)
    setDecisionPending(false)
    setAdoptedStreamingMessage(null)
    setAdoptedPending(false)
    setAdoptedUserMessages([])
  }, [consultationId])

  useEffect(() => {
    if (!consultationId) return
    const stored = readReasoningConfirmedSymptoms(consultationId)
    if (stored.length === 0) return
    setReasoningConfirmedSymptoms((prev) => {
      if (prev.length > 0) return prev
      const normalized = suggestion?.normalizedUserSymptoms ?? []
      return dedupeSymptoms([...normalized, ...stored])
    })
  }, [consultationId, suggestion?.normalizedUserSymptoms])

  const latestModelMessage = useMemo(() => {
    for (let i = transcript.length - 1; i >= 0; i -= 1) {
      if (transcript[i].sender === 'model') return transcript[i]
    }
    return null
  }, [transcript])
  const latestAdoptedReply = useMemo(() => {
    const content = latestModelMessage?.content?.trim()
    if (!content) return false
    return content.startsWith('**采纳病症')
  }, [latestModelMessage?.content])
  const latestModelId = latestModelMessage?.id ?? null
  const canShowInlineCandidatePanel = useMemo(() => {
    if (!latestModelId || decisionPending) return false
    if (latestModelMessage?.content.includes('模型自主分析')) return false
    if (adoptedPending) return false
    if (latestModelMessage?.adoptedSummary) return false
    if (latestModelId === adoptedStreamingMessage?.id) return false
    if (latestAdoptedReply) return false
    return true
  }, [
    adoptedPending,
    adoptedStreamingMessage?.id,
    decisionPending,
    latestAdoptedReply,
    latestModelId,
    latestModelMessage?.content,
  ])
  const suppressCandidatePanel =
    Boolean(latestModelMessage?.content.includes('模型自主分析')) ||
    adoptedPending ||
    Boolean(latestModelMessage?.adoptedSummary) ||
    latestAdoptedReply
  const handleAdoptDisease = async (disease: Disease) => {
    if (!consultationId || readOnly || !draft || adoptedSummaryStream.isPending || adoptedPending) return
    const adoptContent = `采纳病症：${disease.name}`
    const adoptMessage: CaseMessage = {
      id: `adopt-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      sender: 'doctor',
      content: adoptContent,
      createdAt: new Date().toISOString(),
    }
    setAdoptedUserMessages((prev) => [...prev, adoptMessage])
    const adoptTimestamp = Date.parse(adoptMessage.createdAt)
    const streamCreatedAt = Number.isFinite(adoptTimestamp)
      ? new Date(adoptTimestamp + 1).toISOString()
      : new Date().toISOString()
    await updateDraft.mutateAsync({
      consultationId,
      patch: {
        diagnosis: disease.name,
        formulaName: disease.formula,
        symptoms: draft.symptoms,
        status: {
          ...draft.status,
          diagnosis: 'confirmed',
          formulaName: 'confirmed',
        },
      },
    })
    const streamMessage: CaseMessage = {
      id: `adopted-stream-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      sender: 'model',
      content: '',
      createdAt: streamCreatedAt,
      isStreaming: true,
    }
    setAdoptedPending(true)
    setAdoptedStreamingMessage(streamMessage)
    try {
      await adoptedSummaryStream.mutateAsync({
        consultationId,
        adoptedDiseaseId: disease.id,
        message: adoptContent,
        onDelta: (delta) => {
          if (!delta) return
          setAdoptedStreamingMessage((prev) =>
            prev && prev.id === streamMessage.id
              ? { ...prev, content: `${prev.content}${delta}` }
              : prev,
          )
        },
        onDone: (payload) => {
          const normalized = normalizeDialoguePayload(payload)
          const payloadReply =
            normalized && typeof normalized === 'object' && ('reply' in normalized || 'replay' in normalized)
              ? String((normalized as { reply?: string; replay?: string }).reply ?? (normalized as { replay?: string }).replay ?? '')
              : ''
          const finalText = extractAssistantContent(normalized) || payloadReply
          const resolvedCreatedAt = extractAssistantCreatedAt(normalized) || new Date().toISOString()
          const adoptedSummary =
            normalized && typeof normalized === 'object' && 'adopted_summary' in normalized
              ? Boolean((normalized as { adopted_summary?: boolean }).adopted_summary)
              : false
          setAdoptedStreamingMessage((prev) =>
            prev && prev.id === streamMessage.id
              ? {
                  ...prev,
                  content: finalText || prev.content,
                  createdAt: resolvedCreatedAt || prev.createdAt,
                  isStreaming: false,
                  adoptedSummary,
                }
              : prev,
          )
          setAdoptedPending(false)
        },
        onError: () => {
          setAdoptedStreamingMessage(null)
          setAdoptedPending(false)
        },
      })
    } catch {
      setAdoptedStreamingMessage(null)
      setAdoptedPending(false)
    }
  }
  const handleRequestDecision = async () => {
    if (!consultationId || readOnly || decisionStream.isPending || decisionPending) return
    const previousDecisionMessage = decisionStreamingMessage
    setDecisionPending(true)
    const streamMessage: CaseMessage = {
      id: `decision-stream-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      sender: 'model',
      content: '',
      createdAt: new Date().toISOString(),
      isStreaming: true,
    }
    setDecisionStreamingMessage(streamMessage)
    try {
      await decisionStream.mutateAsync({
        consultationId,
        message: null,
        onDelta: (delta) => {
          if (!delta) return
          setDecisionStreamingMessage((prev) =>
            prev && prev.id === streamMessage.id
              ? { ...prev, content: `${prev.content}${delta}` }
              : prev,
          )
        },
        onDone: (payload) => {
          const finalText = extractAssistantContent(payload)
          setDecisionStreamingMessage((prev) =>
            prev && prev.id === streamMessage.id
              ? {
                  ...prev,
                  content: finalText || prev.content,
                  isStreaming: false,
                }
              : prev,
          )
        },
        onError: () => {
          setDecisionStreamingMessage(previousDecisionMessage ?? null)
        },
      })
    } catch {
      setDecisionStreamingMessage(previousDecisionMessage ?? null)
    } finally {
      setDecisionPending(false)
    }
  }
  const candidatePanel =
    consultationId && transcript.length > 0 && !pending && !suppressCandidatePanel ? (
      <ConsultationCandidatePanel
        suggestion={suggestion}
        catalog={catalog}
        decisionLoading={decisionStream.isPending}
        onConfirmedSymptomsChange={(symptoms) => {
          setReasoningConfirmedSymptoms(symptoms)
          if (!consultationId || readOnly) return
          writeReasoningConfirmedSymptoms(consultationId, symptoms)
        }}
        storageKey={consultationId}
        readOnly={readOnly}
        onRequestDecision={!readOnly ? () => void handleRequestDecision() : undefined}
        onAdoptDisease={!readOnly ? (disease) => void handleAdoptDisease(disease) : undefined}
      />
    ) : null

  useEffect(() => {
    if (!open) return
    if (!consultationId) return
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [
    consultationId,
    decisionPending,
    decisionStreamingMessage?.content,
    adoptedPending,
    adoptedStreamingMessage?.content,
    messages?.length,
    open,
  ])

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      <button type="button" onClick={onClose} className="absolute inset-0 bg-black/30" aria-label="关闭问诊" />
      <div className="relative flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl sm:h-[90vh] sm:rounded-3xl">
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

        <div className="grid flex-1 min-h-0 grid-cols-1 gap-4 bg-slate-50 p-4 sm:gap-5 sm:p-5 lg:grid-cols-5">
          <div className="col-span-1 flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white/80 shadow-soft-card sm:rounded-3xl lg:col-span-4">
            <div className="flex items-center justify-between px-5 pt-4 lg:hidden">
              <span className="text-sm font-semibold text-ink">问诊对话</span>
              <button
                type="button"
                onClick={() => setCasePanelOpen(true)}
                className="inline-flex h-8 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                问诊记录
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-5 pt-4 sm:px-6 sm:py-6">
              <div className="mx-auto w-full max-w-6xl">
                <div className="relative">
                  <div className="flex w-full max-w-3xl flex-col gap-4 lg:mx-auto">
                    <CaseChatBubble key="guide" message={consultationGuideMessage} onOpenCitation={(c) => setSelectedCitation(c)} />
                    {transcript.map((m) => (
                      <CaseChatBubble
                        key={m.id}
                        message={m}
                        onOpenCitation={(c) => setSelectedCitation(c)}
                        footer={
                          candidatePanel && canShowInlineCandidatePanel && m.id === latestModelId ? candidatePanel : null
                        }
                      />
                    ))}
                    {pending ? (
                      <div className="flex justify-start">
                        <div className="max-w-[80%] rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
                          正在思考...
                        </div>
                      </div>
                    ) : null}
                    {decisionPending && !decisionStreamingMessage?.content ? (
                      <div className="flex justify-start">
                        <div className="max-w-[80%] rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
                          正在思考...
                        </div>
                      </div>
                    ) : null}
                    {adoptedPending && !adoptedStreamingMessage?.content ? (
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

            <div className="border-t border-slate-100 bg-white/80 px-5 py-4 backdrop-blur sm:px-6">
              <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 sm:flex-row sm:items-stretch">
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
                  className="h-[40px] min-h-[40px] flex-1 rounded-2xl bg-primary-600 text-sm font-semibold text-white shadow-soft-card transition hover:bg-primary-700 disabled:opacity-60 lg:h-[52px] lg:min-h-[52px] lg:w-28 lg:flex-none"
                >
                  发送
                </button>
              </div>
            </div>
          </div>

          <div className="hidden min-h-0 flex-col lg:flex lg:col-span-1">
            <Card
              title="问诊记录"
              className="flex-1 min-h-0 flex flex-col"
              bodyClassName="flex-1 min-h-0 overflow-y-auto"
            >
              {caseBuilder}
            </Card>
          </div>
        </div>
      </div>

      <SourcePreviewModal open={Boolean(selectedCitation)} citation={selectedCitation} onClose={() => setSelectedCitation(null)} />
      <CaseBuilderModal open={casePanelOpen} onClose={() => setCasePanelOpen(false)}>
        {caseBuilder}
      </CaseBuilderModal>
    </div>,
    document.body,
  )
}
