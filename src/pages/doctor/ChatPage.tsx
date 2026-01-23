import { useEffect, useMemo, useRef, useState } from 'react'
import {
  useCaseMessages,
  useCaseSuggestions,
  useCatalog,
  useConsultationDialogue,
  useConsultationDraft,
  useCreateConsultation,
  useCreateDoctorPatient,
  useCurrentUser,
  useDoctorCases,
  useDoctorPatients,
  useSendConsultationMessage,
  useUpdateConsultationDraft,
} from '../../api/queries'
import { Card } from '../../components/Card'
import { CaseChatBubble } from '../../components/CaseChatBubble'
import { CaseBuilderPanel } from '../../components/CaseBuilderPanel'
import { CaseBuilderModal } from '../../components/CaseBuilderModal'
import { ConsultationCandidatePanel } from '../../components/ConsultationCandidatePanel'
import { SourcePreviewModal } from '../../components/SourcePreviewModal'
import { consultationGuideMessage } from '../../lib/consultationGuide'
import { extractAssistantContent } from '../../lib/consultationStream'
import type { CaseMessage, Citation, ConsultationDecision, ConsultationDialogue, Disease } from '../../types'

const lastConsultationStorageKeyBase = 'doctor:lastConsultationId'
const buildLastConsultationKey = (userId?: string) =>
  userId ? `${lastConsultationStorageKeyBase}:${userId}` : lastConsultationStorageKeyBase

export function ChatPage() {
  const [input, setInput] = useState('')
  const [pending, setPending] = useState(false)
  const [consultationId, setConsultationId] = useState<string | null>(null)
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null)
  const [casePanelOpen, setCasePanelOpen] = useState(false)
  const [optimisticMessages, setOptimisticMessages] = useState<CaseMessage[]>([])
  const [streamingMessage, setStreamingMessage] = useState<CaseMessage | null>(null)
  const [decisionResult, setDecisionResult] = useState<ConsultationDialogue | null>(null)
  const [candidatePending, setCandidatePending] = useState(false)
  const candidateSnapshotRef = useRef<typeof suggestion | null>(null)

  const { data: currentUser } = useCurrentUser('doctor')
  const lastConsultationStorageKey = useMemo(
    () => buildLastConsultationKey(currentUser?.id),
    [currentUser?.id],
  )

  const { data: doctorCases } = useDoctorCases()
  const latestCaseId = useMemo(() => {
    if (!doctorCases || doctorCases.length === 0) return null
    return doctorCases
      .slice()
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0]
      ?.id ?? null
  }, [doctorCases])
  const { data: patients } = useDoctorPatients()
  const { data: catalog } = useCatalog()
  const createConsultation = useCreateConsultation()
  const createPatient = useCreateDoctorPatient()
  const { data: messages, error: messagesError } = useCaseMessages(consultationId ?? undefined)
  const { data: suggestion, error: suggestionsError } = useCaseSuggestions(consultationId ?? undefined)
  const { data: draft, error: draftError } = useConsultationDraft(consultationId ?? undefined)
  const updateDraft = useUpdateConsultationDraft()
  const sendMessage = useSendConsultationMessage()
  const dialogue = useConsultationDialogue()

  const bottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!consultationId) return
    localStorage.setItem(lastConsultationStorageKey, consultationId)
  }, [consultationId])

  useEffect(() => {
    setOptimisticMessages([])
    setStreamingMessage(null)
    setDecisionResult(null)
    setCandidatePending(false)
    candidateSnapshotRef.current = null
  }, [consultationId])

  useEffect(() => {
    if (consultationId) return
    const last = localStorage.getItem(lastConsultationStorageKey)
    if (last) {
      setConsultationId(last)
      return
    }
    if (latestCaseId) {
      setConsultationId(latestCaseId)
      return
    }
    if (createConsultation.isPending) return
    void createConsultation.mutateAsync(undefined).then((res) => {
      setConsultationId(res.consultationId)
    })
  }, [consultationId, createConsultation, latestCaseId, lastConsultationStorageKey])

  useEffect(() => {
    if (!consultationId) return
    const error = messagesError ?? suggestionsError ?? draftError
    if (!error) return
    const status = (error as Error & { status?: number }).status
    if (status !== 404) return
    localStorage.removeItem(lastConsultationStorageKey)
    if (createConsultation.isPending) return
    void createConsultation.mutateAsync(undefined).then((res) => {
      setConsultationId(res.consultationId)
    })
  }, [consultationId, createConsultation, draftError, messagesError, suggestionsError])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages?.length, streamingMessage?.content, decisionResult, dialogue.isPending])

  useEffect(() => {
    if (!candidatePending) return
    if (suggestion !== candidateSnapshotRef.current) {
      setCandidatePending(false)
    }
  }, [candidatePending, suggestion])

  const canSend = useMemo(() => input.trim().length > 0 && !pending, [input, pending])
  const transcript = useMemo(() => {
    return (messages ?? [])
      .concat(optimisticMessages)
      .concat(streamingMessage && streamingMessage.content ? [streamingMessage] : [])
      .slice()
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  }, [messages, optimisticMessages, streamingMessage])

  const latestAssistantId = useMemo(() => {
    for (let i = transcript.length - 1; i >= 0; i -= 1) {
      if (transcript[i].sender !== 'doctor') return transcript[i].id
    }
    return null
  }, [transcript])

  useEffect(() => {
    if (!messages || messages.length === 0) return
    setOptimisticMessages((prev) => {
      if (prev.length === 0) return prev
      const counts = new Map<string, number>()
      messages.forEach((message) => {
        if (message.sender !== 'doctor') return
        counts.set(message.content, (counts.get(message.content) ?? 0) + 1)
      })
      return prev.filter((message) => {
        const count = counts.get(message.content) ?? 0
        if (count <= 0) return true
        counts.set(message.content, count - 1)
        return false
      })
    })
  }, [messages])

  useEffect(() => {
    if (!streamingMessage || !messages || messages.length === 0) return
    const matched = messages.some(
      (message) => message.sender !== 'doctor' && message.content === streamingMessage.content,
    )
    if (matched) {
      setStreamingMessage(null)
    }
  }, [messages, streamingMessage])

  const suggestedSymptoms = useMemo(() => suggestion?.confirmedSymptoms ?? [], [suggestion?.confirmedSymptoms])
  const caseBuilder = !consultationId || !draft ? (
    <div className="text-sm text-slate-600">正在加载...</div>
  ) : (
    <CaseBuilderPanel
      consultationId={consultationId}
      draft={draft}
      patients={patients ?? []}
      suggestion={suggestion}
      suggestedSymptoms={suggestedSymptoms}
      saving={updateDraft.isPending}
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

  const send = async () => {
    const content = input.trim()
    if (!content || pending) return
    if (!consultationId) return

    const tempMessage: CaseMessage = {
      id: `temp-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      sender: 'doctor',
      content,
      createdAt: new Date().toISOString(),
    }
    setOptimisticMessages((prev) => [...prev, tempMessage])
    const streamMessage: CaseMessage = {
      id: `stream-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      sender: 'model',
      content: '',
      createdAt: new Date().toISOString(),
      isStreaming: true,
    }
    setStreamingMessage(streamMessage)
    setInput('')
    setDecisionResult(null)
    candidateSnapshotRef.current = suggestion ?? null
    setCandidatePending(true)
    setPending(true)
    try {
      await sendMessage.mutateAsync({
        consultationId,
        content,
        onDelta: (delta) => {
          if (!delta) return
          setStreamingMessage((prev) =>
            prev && prev.id === streamMessage.id
              ? { ...prev, content: `${prev.content}${delta}` }
              : prev,
          )
        },
        onDone: (payload) => {
          const finalText = extractAssistantContent(payload)
          setStreamingMessage((prev) =>
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
          setStreamingMessage(null)
          setCandidatePending(false)
        },
      })
    } catch {
      setOptimisticMessages((prev) => prev.filter((message) => message.id !== tempMessage.id))
      setStreamingMessage(null)
      setCandidatePending(false)
    } finally {
      setPending(false)
    }
  }

  const handleAdoptDisease = async (disease: Disease) => {
    if (!consultationId || !draft) return
    await updateDraft.mutateAsync({
      consultationId,
      patch: {
        diagnosis: disease.name,
        formulaName: disease.formula,
        status: {
          ...draft.status,
          diagnosis: 'confirmed',
          formulaName: 'confirmed',
        },
      },
    })
  }

  const handleAdoptDecision = async (decision: ConsultationDecision) => {
    if (!consultationId || !draft) return
    await updateDraft.mutateAsync({
      consultationId,
      patch: {
        diagnosis: decision.diseaseName,
        formulaName: decision.prescription,
        status: {
          ...draft.status,
          diagnosis: 'confirmed',
          formulaName: 'confirmed',
        },
      },
    })
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
    <div className="grid h-full flex-1 min-h-0 grid-cols-1 gap-5 overflow-hidden lg:grid-cols-5">
      <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white/70 shadow-soft-card lg:col-span-4">
        <div className="flex items-center justify-between px-6 pt-5 lg:hidden">
          <span className="text-sm font-semibold text-ink">问诊对话</span>
          <button
            type="button"
            onClick={() => setCasePanelOpen(true)}
            className="inline-flex h-8 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            问诊记录
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 lg:py-6">
          <div className="mx-auto w-full max-w-6xl">
            <div className="relative">
              <div className="flex w-full max-w-3xl flex-col gap-4 lg:mx-auto">
                <CaseChatBubble message={consultationGuideMessage} onOpenCitation={(c) => setSelectedCitation(c)} />
                {transcript.map((m) => (
                  <CaseChatBubble
                    key={m.id}
                    message={m}
                    onOpenCitation={(c) => setSelectedCitation(c)}
                    hideTimestamp={Boolean(streamingMessage && m.id === streamingMessage.id)}
                    footer={
                      m.id === latestAssistantId && m.sender !== 'doctor' ? (
                        <ConsultationCandidatePanel
                          suggestion={suggestion}
                          catalog={catalog}
                          symptomsText={draft?.symptoms}
                          decision={decisionResult?.decision ?? null}
                          decisionReply={decisionResult?.reply}
                          decisionLoading={dialogue.isPending}
                          candidateLoading={candidatePending}
                          onRequestDecision={
                            consultationId
                              ? () =>
                                  dialogue
                                    .mutateAsync({
                                      consultationId,
                                      mode: 'model_decision',
                                      message: null,
                                    })
                                    .then((result) => setDecisionResult(result))
                                    .catch(() => setDecisionResult(null))
                              : undefined
                          }
                          onAdoptDecision={(decision) => void handleAdoptDecision(decision)}
                          onAdoptDisease={(disease) => void handleAdoptDisease(disease)}
                        />
                      ) : null
                    }
                  />
                ))}
                {pending && !streamingMessage?.content ? (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
                      <span className="inline-flex items-center">
                        正在思考
                        <span className="thinking-dots" aria-hidden>
                          <span className="thinking-dot" />
                          <span className="thinking-dot" />
                          <span className="thinking-dot" />
                        </span>
                      </span>
                    </div>
                  </div>
                ) : null}
                <div ref={bottomRef} />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 bg-white/80 px-6 py-4 backdrop-blur">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 sm:flex-row sm:items-center">
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
            <div className="flex flex-row items-center gap-3">
              <button
                type="button"
                onClick={() => void send()}
                disabled={!consultationId || !canSend}
                className="h-11 flex-1 rounded-2xl bg-primary-600 text-sm font-semibold text-white shadow-soft-card transition hover:bg-primary-700 disabled:opacity-60 sm:h-[52px] sm:w-28 sm:flex-none"
              >
                发送
              </button>
              <button
                type="button"
                onClick={() => void startNew()}
                disabled={createConsultation.isPending}
                className="h-11 flex-1 rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 sm:h-[52px] sm:w-28 sm:flex-none"
              >
                开启新问诊
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden min-h-0 flex-col lg:flex lg:col-span-1">
        <Card title="问诊记录" className="flex-1 min-h-0 flex flex-col" bodyClassName="flex-1 min-h-0 overflow-y-auto">
          {caseBuilder}
        </Card>
      </div>

      <SourcePreviewModal open={Boolean(selectedCitation)} citation={selectedCitation} onClose={() => setSelectedCitation(null)} />
      <CaseBuilderModal open={casePanelOpen} onClose={() => setCasePanelOpen(false)}>
        {caseBuilder}
      </CaseBuilderModal>
    </div>
  )
}
