import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  useCaseMessages,
  useCaseSuggestions,
  useCatalog,
  useConsultationDecisionStream,
  useConsultationDraft,
  useCreateDoctorPatient,
  useDoctorPatients,
  useSendConsultationMessage,
  useUpdateConsultationDraft,
} from '../api/queries'
import { ConsultationCandidatePanel } from './ConsultationCandidatePanel'
import { CaseBuilderModal } from './CaseBuilderModal'
import { ChatMessage } from './ChatMessage'
import { Card } from './Card'
import { CaseBuilderPanel } from './CaseBuilderPanel'
import { extractAssistantContent } from '../lib/consultationStream'
import { dedupeSymptoms, readReasoningConfirmedSymptoms, writeReasoningConfirmedSymptoms } from '../lib/reasoningStorage'
import type { CaseMessage, ConsultationDraft, Disease } from '../types'

export function DoctorWorkspace({ consultationId }: { consultationId?: string }) {
  const { caseId } = useParams()
  const activeId = consultationId ?? caseId
  const { data: messages } = useCaseMessages(activeId)
  const { data: suggestion } = useCaseSuggestions(activeId)
  const { data: draft } = useConsultationDraft(activeId)
  const { data: catalog } = useCatalog()
  const { data: patients } = useDoctorPatients()
  const createPatient = useCreateDoctorPatient()
  const updateDraft = useUpdateConsultationDraft()
  const sendMessage = useSendConsultationMessage()
  const decisionStream = useConsultationDecisionStream()

  const [optimisticMessages, setOptimisticMessages] = useState<CaseMessage[]>([])
  const [streamingMessage, setStreamingMessage] = useState<CaseMessage | null>(null)
  const [streamingMatchId, setStreamingMatchId] = useState<string | null>(null)
  const [decisionStreamingMessage, setDecisionStreamingMessage] = useState<CaseMessage | null>(null)
  const [candidatePending, setCandidatePending] = useState(false)
  const [decisionPending, setDecisionPending] = useState(false)
  const [reasoningConfirmedSymptoms, setReasoningConfirmedSymptoms] = useState<string[]>([])
  const candidateSnapshotRef = useRef<typeof suggestion | null>(null)
  const draftSnapshotRef = useRef<ConsultationDraft | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setOptimisticMessages([])
    setStreamingMessage(null)
    setStreamingMatchId(null)
    setDecisionStreamingMessage(null)
    setCandidatePending(false)
    setDecisionPending(false)
    setReasoningConfirmedSymptoms([])
    candidateSnapshotRef.current = null
    draftSnapshotRef.current = null
  }, [activeId])

  useEffect(() => {
    if (!activeId) return
    const stored = readReasoningConfirmedSymptoms(activeId)
    if (stored.length === 0) return
    setReasoningConfirmedSymptoms((prev) => {
      if (prev.length > 0) return prev
      const normalized = suggestion?.normalizedUserSymptoms ?? []
      return dedupeSymptoms([...normalized, ...stored])
    })
  }, [activeId, suggestion?.normalizedUserSymptoms])

  useEffect(() => {
    if (!draft) return
    draftSnapshotRef.current = draft
  }, [draft])

  const handleConfirmedSymptomsChange = useCallback(
    (symptoms: string[]) => {
      setReasoningConfirmedSymptoms(symptoms)
      if (!activeId) return
      writeReasoningConfirmedSymptoms(activeId, symptoms)
    },
    [activeId],
  )

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
    const matched = messages.find(
      (message) => message.sender !== 'doctor' && message.content === streamingMessage.content,
    )
    if (!matched) return
    setStreamingMessage((prev) => {
      if (!prev) return matched
      const prevTime = Date.parse(prev.createdAt)
      const matchedTime = Date.parse(matched.createdAt)
      const createdAt =
        Number.isFinite(matchedTime) && (!Number.isFinite(prevTime) || matchedTime > prevTime)
          ? matched.createdAt
          : prev.createdAt
      return {
        ...matched,
        id: prev.id,
        createdAt,
        isStreaming: false,
      }
    })
    setStreamingMatchId(matched.id)
  }, [messages, streamingMessage])
  useEffect(() => {
    if (streamingMessage) return
    if (!streamingMatchId) return
    setStreamingMatchId(null)
  }, [streamingMatchId, streamingMessage])

  useEffect(() => {
    if (!candidatePending) return
    if (suggestion !== candidateSnapshotRef.current) {
      setCandidatePending(false)
    }
  }, [candidatePending, suggestion])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [
    messages?.length,
    streamingMessage?.content,
    decisionStreamingMessage?.content,
    decisionStream.isPending,
    decisionPending,
    candidatePending,
    suggestion?.candidateDiseases?.length,
    suggestion?.candidateSymptomDetails?.length,
  ])

  const suggestedSymptoms = useMemo(() => {
    if (reasoningConfirmedSymptoms.length > 0) return reasoningConfirmedSymptoms
    return suggestion?.confirmedSymptoms ?? []
  }, [reasoningConfirmedSymptoms, suggestion?.confirmedSymptoms])

  const groupedMessages = useMemo(
    () =>
      ((messages ?? [])
        .filter((message) => !streamingMatchId || message.id !== streamingMatchId)
        .concat(optimisticMessages)
        .concat(streamingMessage && streamingMessage.content ? [streamingMessage] : [])
        .concat(decisionStreamingMessage && decisionStreamingMessage.content ? [decisionStreamingMessage] : [])
        .map((message, index) => ({ message, index }))
        .sort((a, b) => {
          const timeA = Date.parse(a.message.createdAt)
          const timeB = Date.parse(b.message.createdAt)
          if (Number.isFinite(timeA) && Number.isFinite(timeB) && timeA !== timeB) {
            return timeA - timeB
          }
          if (Number.isFinite(timeA) && !Number.isFinite(timeB)) return -1
          if (!Number.isFinite(timeA) && Number.isFinite(timeB)) return 1
          return a.index - b.index
        })
        .map(({ message }) => message)),
    [messages, optimisticMessages, streamingMessage, decisionStreamingMessage, streamingMatchId],
  )

  const latestModelMessage = useMemo(() => {
    for (let i = groupedMessages.length - 1; i >= 0; i -= 1) {
      if (groupedMessages[i].sender === 'model') return groupedMessages[i]
    }
    return null
  }, [groupedMessages])
  const latestModelId = latestModelMessage?.id ?? null
  const canShowInlineCandidatePanel = useMemo(() => {
    if (!latestModelId || decisionPending) return false
    if (latestModelMessage?.content.includes('模型自主分析')) return false
    return true
  }, [decisionPending, latestModelId, latestModelMessage?.content])

  const [input, setInput] = useState('')
  const [casePanelOpen, setCasePanelOpen] = useState(false)

  const suppressCandidatePanel = Boolean(latestModelMessage?.content.includes('模型自主分析'))
  const canShowCandidatePanel =
    Boolean(activeId) && (candidatePending || groupedMessages.length > 0) && !decisionPending && !suppressCandidatePanel
  const candidatePanel = canShowCandidatePanel ? (
    <ConsultationCandidatePanel
      suggestion={suggestion}
      catalog={catalog}
      decisionLoading={decisionStream.isPending}
      candidateLoading={candidatePending}
      onConfirmedSymptomsChange={handleConfirmedSymptomsChange}
      storageKey={activeId}
      onRequestDecision={activeId ? () => void handleRequestDecision() : undefined}
      onAdoptDisease={(disease) => void handleAdoptDisease(disease)}
    />
  ) : null

  useEffect(() => {
    if (candidatePending) return
    if (!suggestion) return
    if (!canShowCandidatePanel) return
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [
    candidatePending,
    canShowCandidatePanel,
    suggestion?.candidateDiseases?.length,
    suggestion?.candidateSymptomDetails?.length,
  ])

  const send = async () => {
    if (!activeId) return
    const content = input.trim()
    if (!content) return
    const tempMessage: CaseMessage = {
      id: `temp-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      sender: 'doctor',
      content,
      createdAt: new Date().toISOString(),
    }
    setOptimisticMessages((prev) => [...prev, tempMessage])
    const tempTimestamp = Date.parse(tempMessage.createdAt)
    const streamCreatedAt = Number.isFinite(tempTimestamp)
      ? new Date(tempTimestamp + 1).toISOString()
      : new Date().toISOString()
    const streamMessage: CaseMessage = {
      id: `stream-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      sender: 'model',
      content: '',
      createdAt: streamCreatedAt,
      isStreaming: true,
    }
    setStreamingMessage(streamMessage)
    setStreamingMatchId(null)
    setInput('')
    candidateSnapshotRef.current = suggestion ?? null
    setCandidatePending(true)
    const draftSnapshot = draftSnapshotRef.current
    if (draftSnapshot) {
      try {
        await updateDraft.mutateAsync({
          consultationId: activeId,
          patch: {
            patientId: draftSnapshot.patientId,
            symptoms: draftSnapshot.symptoms,
            diagnosis: draftSnapshot.diagnosis,
            formulaName: draftSnapshot.formulaName,
            formulaDetail: draftSnapshot.formulaDetail,
            usageNote: draftSnapshot.usageNote,
            note: draftSnapshot.note,
            status: draftSnapshot.status,
          },
        })
      } catch {
        setOptimisticMessages((prev) => prev.filter((message) => message.id !== tempMessage.id))
        setStreamingMessage(null)
        setStreamingMatchId(null)
        setCandidatePending(false)
        return
      }
    }
    try {
      await sendMessage.mutateAsync({
        consultationId: activeId,
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
          setStreamingMatchId(null)
          setCandidatePending(false)
        },
      })
    } catch {
      setOptimisticMessages((prev) => prev.filter((message) => message.id !== tempMessage.id))
      setStreamingMessage(null)
      setStreamingMatchId(null)
      setCandidatePending(false)
    }
  }

  const handleAdoptDisease = async (disease: Disease) => {
    if (!activeId || !draft) return
    await updateDraft.mutateAsync({
      consultationId: activeId,
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
  }

  const handleRequestDecision = async () => {
    if (!activeId || decisionStream.isPending || decisionPending) return
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
    const draftSnapshot = draftSnapshotRef.current
    if (draftSnapshot) {
      try {
        await updateDraft.mutateAsync({
          consultationId: activeId,
          patch: {
            patientId: draftSnapshot.patientId,
            symptoms: draftSnapshot.symptoms,
            diagnosis: draftSnapshot.diagnosis,
            formulaName: draftSnapshot.formulaName,
            formulaDetail: draftSnapshot.formulaDetail,
            usageNote: draftSnapshot.usageNote,
            note: draftSnapshot.note,
            status: draftSnapshot.status,
          },
        })
      } catch {
        setDecisionPending(false)
        setDecisionStreamingMessage(previousDecisionMessage)
        return
      }
    }
    try {
      await decisionStream.mutateAsync({
        consultationId: activeId,
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
          const payloadReply =
            payload && typeof payload === 'object' && 'reply' in payload
              ? String((payload as { reply?: string }).reply ?? '')
              : ''
          const finalText = extractAssistantContent(payload) || payloadReply
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
          setDecisionStreamingMessage(null)
        },
      })
    } catch {
      setDecisionStreamingMessage(null)
    } finally {
      setDecisionPending(false)
    }
  }

  const caseBuilder = !draft || !activeId ? (
    <div className="text-slate-600">正在加载草稿...</div>
  ) : (
    <CaseBuilderPanel
      consultationId={activeId}
      draft={draft}
      patients={patients ?? []}
      suggestedSymptoms={suggestedSymptoms}
      saving={updateDraft.isPending}
      onDraftChange={(next) => {
        draftSnapshotRef.current = next
      }}
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
    />
  )

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Card
          title="问诊对话"
          action={
            <div className="flex items-center gap-2">
              <span className="hidden text-xs text-slate-500 lg:inline">来源标注：规则 / RAG / 模型</span>
              <button
                type="button"
                onClick={() => setCasePanelOpen(true)}
                className="inline-flex h-8 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 lg:hidden"
              >
                问诊记录
              </button>
            </div>
          }
          className="flex min-h-[60vh] max-h-[72vh] flex-col"
          bodyClassName="flex-1 min-h-0 flex flex-col"
        >
          <div className="flex-1 min-h-0 overflow-y-auto pr-1">
            <div className="flex flex-col gap-3">
              {groupedMessages.map((m) => (
                <ChatMessage
                  key={m.id}
                  message={m}
                  hideTimestamp={Boolean(m.isStreaming)}
                  footer={
                    m.id === latestModelId &&
                    m.sender === 'model' &&
                    !decisionPending &&
                    !m.content.includes('模型自主分析') ? (
                    candidatePanel
                    ) : null
                  }
                />
              ))}
              {decisionPending && !decisionStreamingMessage?.content ? (
                <div className="rounded-2xl border border-slate-100 bg-white/80 p-3 text-sm text-slate-600 shadow-sm">
                  <span className="inline-flex items-center">
                    正在思考
                    <span className="thinking-dots" aria-hidden>
                      <span className="thinking-dot" />
                      <span className="thinking-dot" />
                      <span className="thinking-dot" />
                    </span>
                  </span>
                </div>
              ) : null}
              <div ref={bottomRef} />
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-100 bg-white/70 p-3">
            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-end">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={2}
                placeholder="输入医生追问或患者补充（Enter 发送，Shift+Enter 换行）"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    void send()
                  }
                }}
                className="min-h-[52px] flex-1 resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              />
              <button
                type="button"
                disabled={!activeId || input.trim().length === 0 || sendMessage.isPending}
                onClick={() => void send()}
                className="h-[52px] w-full rounded-2xl bg-primary-600 px-5 text-sm font-semibold text-white shadow-soft-card transition hover:bg-primary-700 disabled:opacity-60 sm:w-auto"
              >
                发送
              </button>
            </div>
          </div>
        </Card>
      </div>
      <div className="hidden space-y-4 lg:block">
        <Card title="问诊记录" action={<span className="text-xs text-slate-500">候选点击即确认</span>}>
          {caseBuilder}
        </Card>
      </div>

      <CaseBuilderModal open={casePanelOpen} onClose={() => setCasePanelOpen(false)}>
        {caseBuilder}
      </CaseBuilderModal>
    </div>
  )
}
