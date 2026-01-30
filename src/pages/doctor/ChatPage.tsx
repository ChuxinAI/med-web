import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  useCaseMessages,
  useCaseSuggestions,
  useCatalog,
  useConsultationAdoptedSummaryStream,
  useConsultationDecisionStream,
  useConsultationDraft,
  useCreateConsultation,
  useCreateDoctorPatient,
  useCurrentUser,
  useDoctorCases,
  useDoctorPatients,
  useSendConsultationMessage,
  useUpdateConsultationDraft,
  useExtractDiseaseFormula,
} from '../../api/queries'
import { Card } from '../../components/Card'
import { CaseChatBubble } from '../../components/CaseChatBubble'
import { CaseBuilderPanel } from '../../components/CaseBuilderPanel'
import { CaseBuilderModal } from '../../components/CaseBuilderModal'
import { ConsultationCandidatePanel } from '../../components/ConsultationCandidatePanel'
import { InlineNotice } from '../../components/InlineNotice'
import { SourcePreviewModal } from '../../components/SourcePreviewModal'
import { DecisionAdoptAction } from '../../components/DecisionAdoptAction'
import { consultationGuideMessage } from '../../lib/consultationGuide'
import {
  extractAssistantContent,
  extractAssistantCreatedAt,
  normalizeDialoguePayload,
} from '../../lib/consultationStream'
import {
  clearReasoningState,
  dedupeSymptoms,
  readReasoningConfirmedSymptoms,
  writeReasoningConfirmedSymptoms,
} from '../../lib/reasoningStorage'
import type { CaseMessage, Citation, ConsultationDraft, Disease } from '../../types'
import { clearCachedSuggestion } from '../../lib/suggestionStorage'
import { useQueryClient } from '@tanstack/react-query'

const lastConsultationStorageKeyBase = 'doctor:lastConsultationId'
const buildLastConsultationKey = (userId?: string) =>
  userId ? `${lastConsultationStorageKeyBase}:${userId}` : lastConsultationStorageKeyBase
let createConsultationPromise: Promise<string> | null = null

export function ChatPage() {
  const [input, setInput] = useState('')
  const [pending, setPending] = useState(false)
  const [consultationId, setConsultationId] = useState<string | null>(null)
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null)
  const [casePanelOpen, setCasePanelOpen] = useState(false)
  const [optimisticMessages, setOptimisticMessages] = useState<CaseMessage[]>([])
  const [streamingMessage, setStreamingMessage] = useState<CaseMessage | null>(null)
  const [streamingMatchId, setStreamingMatchId] = useState<string | null>(null)
  const [decisionStreamingMessage, setDecisionStreamingMessage] = useState<CaseMessage | null>(null)
  const [adoptedStreamingMessage, setAdoptedStreamingMessage] = useState<CaseMessage | null>(null)
  const [candidatePending, setCandidatePending] = useState(false)
  const [decisionPending, setDecisionPending] = useState(false)
  const [adoptedPending, setAdoptedPending] = useState(false)
  const [decisionReplyContent, setDecisionReplyContent] = useState<string | null>(null)
  const [decisionReplyId, setDecisionReplyId] = useState<string | null>(null)
  const [decisionAdopting, setDecisionAdopting] = useState(false)
  const [decisionAdoptError, setDecisionAdoptError] = useState<string | null>(null)
  const [reasoningConfirmedSymptoms, setReasoningConfirmedSymptoms] = useState<string[]>([])
  const [notice, setNotice] = useState<{ tone: 'success' | 'error' | 'info'; message: string } | null>(null)
  const candidateSnapshotRef = useRef<typeof suggestion | null>(null)
  const draftSnapshotRef = useRef<ConsultationDraft | null>(null)
  const createInFlightRef = useRef(false)
  const forceNewRef = useRef(false)
  const activeSessionRef = useRef(0)
  const activeConsultationRef = useRef<string | null>(null)

  const queryClient = useQueryClient()
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
  const { data: catalog, refetch: refetchCatalog } = useCatalog()
  const createConsultation = useCreateConsultation()
  const createPatient = useCreateDoctorPatient()
  const { data: messages, error: messagesError } = useCaseMessages(consultationId ?? undefined)
  const { data: suggestion, error: suggestionsError } = useCaseSuggestions(consultationId ?? undefined)
  const { data: draft, error: draftError } = useConsultationDraft(consultationId ?? undefined)
  const updateDraft = useUpdateConsultationDraft()
  const sendMessage = useSendConsultationMessage()
  const decisionStream = useConsultationDecisionStream()
  const adoptedSummaryStream = useConsultationAdoptedSummaryStream()
  const extractDiseaseFormula = useExtractDiseaseFormula()
  const candidateIdsKey = useMemo(() => {
    const ids = (suggestion?.candidateDiseases ?? []).map((item) => item.id).filter(Boolean)
    if (ids.length === 0) return null
    return ids.slice().sort().join('|')
  }, [suggestion?.candidateDiseases])
  const lastCatalogRefreshKeyRef = useRef<string | null>(null)

  const bottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!consultationId) return
    localStorage.setItem(lastConsultationStorageKey, consultationId)
  }, [consultationId])

  useEffect(() => {
    setOptimisticMessages([])
    setStreamingMessage(null)
    setStreamingMatchId(null)
    setDecisionStreamingMessage(null)
    setAdoptedStreamingMessage(null)
    setCandidatePending(false)
    setDecisionPending(false)
    setAdoptedPending(false)
    setDecisionReplyContent(null)
    setDecisionReplyId(null)
    setDecisionAdopting(false)
    setDecisionAdoptError(null)
    setReasoningConfirmedSymptoms([])
    candidateSnapshotRef.current = null
    draftSnapshotRef.current = null
    activeSessionRef.current += 1
    activeConsultationRef.current = consultationId
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

  useEffect(() => {
    if (!draft) return
    draftSnapshotRef.current = draft
  }, [draft])

  const handleConfirmedSymptomsChange = useCallback(
    (symptoms: string[]) => {
      setReasoningConfirmedSymptoms(symptoms)
      if (!consultationId) return
      writeReasoningConfirmedSymptoms(consultationId, symptoms)
    },
    [consultationId],
  )

  const requestNewConsultation = useCallback(async () => {
    if (createConsultationPromise) {
      const existingId = await createConsultationPromise
      setConsultationId(existingId)
      forceNewRef.current = false
      return
    }
    if (createInFlightRef.current || createConsultation.isPending) return
    createInFlightRef.current = true
    try {
      createConsultationPromise = createConsultation
        .mutateAsync(undefined)
        .then((res) => res.consultationId)
      const newId = await createConsultationPromise
      setConsultationId(newId)
      clearCachedSuggestion(newId)
      clearReasoningState(newId)
      forceNewRef.current = false
    } finally {
      createInFlightRef.current = false
      createConsultationPromise = null
    }
  }, [createConsultation])

  useEffect(() => {
    if (consultationId) return
    if (forceNewRef.current) return
    const last = localStorage.getItem(lastConsultationStorageKey)
    if (last) {
      setConsultationId(last)
      return
    }
    if (latestCaseId) {
      setConsultationId(latestCaseId)
      return
    }
    void requestNewConsultation()
  }, [consultationId, latestCaseId, lastConsultationStorageKey, requestNewConsultation])

  useEffect(() => {
    if (!consultationId) return
    const error = messagesError ?? suggestionsError ?? draftError
    if (!error) return
    const status = (error as Error & { status?: number }).status
    if (status !== 404) return
    localStorage.removeItem(lastConsultationStorageKey)
    void requestNewConsultation()
  }, [consultationId, draftError, lastConsultationStorageKey, messagesError, requestNewConsultation, suggestionsError])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [
    messages?.length,
    streamingMessage?.content,
    decisionStreamingMessage?.content,
    adoptedStreamingMessage?.content,
    decisionStream.isPending,
    decisionPending,
    adoptedPending,
    candidatePending,
    suggestion?.candidateDiseases?.length,
    suggestion?.candidateSymptomDetails?.length,
  ])

  useEffect(() => {
    if (!candidatePending) return
    if (suggestion !== candidateSnapshotRef.current) {
      setCandidatePending(false)
    }
  }, [candidatePending, suggestion])

  useEffect(() => {
    if (!catalog) return
    if (!candidateIdsKey) return
    const catalogIds = new Set(catalog.map((item) => item.id))
    const hasMissing = (suggestion?.candidateDiseases ?? []).some((item) => item.id && !catalogIds.has(item.id))
    if (!hasMissing) return
    if (lastCatalogRefreshKeyRef.current === candidateIdsKey) return
    lastCatalogRefreshKeyRef.current = candidateIdsKey
    void refetchCatalog()
  }, [catalog, candidateIdsKey, refetchCatalog, suggestion?.candidateDiseases])

  const canSend = useMemo(() => input.trim().length > 0 && !pending, [input, pending])
  const transcript = useMemo(() => {
    const items = (messages ?? [])
      .filter((message) => !streamingMatchId || message.id !== streamingMatchId)
      .concat(optimisticMessages)
      .concat(streamingMessage && streamingMessage.content ? [streamingMessage] : [])
      .concat(decisionStreamingMessage && decisionStreamingMessage.content ? [decisionStreamingMessage] : [])
      .concat(adoptedStreamingMessage ? [adoptedStreamingMessage] : [])
    return items
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
      .map(({ message }) => message)
  }, [
    messages,
    optimisticMessages,
    streamingMessage,
    decisionStreamingMessage,
    adoptedStreamingMessage,
    streamingMatchId,
  ])

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
    if (latestAdoptedReply) return false
    return true
  }, [decisionPending, latestAdoptedReply, latestModelId, latestModelMessage?.content])

  const isDraftEmpty = useMemo(() => {
    if (!draft) return false
    if (draft.patientId) return false
    return (
      draft.symptoms.trim().length === 0 &&
      draft.diagnosis.trim().length === 0 &&
      draft.formulaName.trim().length === 0 &&
      draft.formulaDetail.trim().length === 0 &&
      draft.usageNote.trim().length === 0 &&
      draft.note.trim().length === 0
    )
  }, [draft])

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
    if (streamingMatchId === matched.id && !streamingMessage.isStreaming) return
    setStreamingMessage((prev) => {
      if (!prev) return matched
      const prevTime = Date.parse(prev.createdAt)
      const matchedTime = Date.parse(matched.createdAt)
      const createdAt =
        Number.isFinite(matchedTime) && (!Number.isFinite(prevTime) || matchedTime > prevTime)
          ? matched.createdAt
          : prev.createdAt
      const next = {
        ...matched,
        id: prev.id,
        createdAt,
        isStreaming: false,
      }
      if (
        prev.id === next.id &&
        prev.sender === next.sender &&
        prev.content === next.content &&
        prev.createdAt === next.createdAt &&
        prev.isStreaming === next.isStreaming
      ) {
        return prev
      }
      return next
    })
    setStreamingMatchId(matched.id)
  }, [messages, streamingMessage, streamingMatchId])
  useEffect(() => {
    if (streamingMessage) return
    if (!streamingMatchId) return
    setStreamingMatchId(null)
  }, [streamingMatchId, streamingMessage])
  useEffect(() => {
    if (!decisionStreamingMessage || decisionStreamingMessage.isStreaming) return
    if (!messages || messages.length === 0) return
    const matched = messages.find(
      (message) => message.sender === 'model' && message.content === decisionStreamingMessage.content,
    )
    if (!matched) return
    setDecisionStreamingMessage(null)
    setDecisionPending(false)
  }, [decisionStreamingMessage, messages])
  useEffect(() => {
    if (!adoptedStreamingMessage || adoptedStreamingMessage.isStreaming) return
    if (!messages || messages.length === 0) return
    const matched = messages.find(
      (message) => message.sender === 'model' && message.content === adoptedStreamingMessage.content,
    )
    if (!matched) return
    setAdoptedStreamingMessage(null)
    setAdoptedPending(false)
  }, [adoptedStreamingMessage, messages])

  const suggestedSymptoms = useMemo(() => {
    if (reasoningConfirmedSymptoms.length > 0) return reasoningConfirmedSymptoms
    return suggestion?.confirmedSymptoms ?? []
  }, [reasoningConfirmedSymptoms, suggestion?.confirmedSymptoms])

  useEffect(() => {
    if (!notice) return
    if (notice.tone !== 'info') return
    if (transcript.length > 0 || !isDraftEmpty) {
      setNotice(null)
    }
  }, [isDraftEmpty, notice, transcript.length])

  useEffect(() => {
    if (!notice) return
    if (notice.tone !== 'error') return
    if (draft?.patientId) {
      setNotice(null)
    }
  }, [draft?.patientId, notice])
  const caseBuilder = !consultationId || !draft ? (
    <div className="text-sm text-slate-600">正在加载...</div>
  ) : (
    <CaseBuilderPanel
      consultationId={consultationId}
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
    const sessionToken = activeSessionRef.current
    const sessionConsultationId = consultationId
    const isStale = () =>
      activeSessionRef.current !== sessionToken || activeConsultationRef.current !== sessionConsultationId
    const draftSnapshot = draftSnapshotRef.current ?? draft
    if (!draftSnapshot?.patientId) {
      setNotice({ tone: 'error', message: '请先关联患者后再发送问诊对话。' })
      return
    }
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
    setPending(true)
    if (draftSnapshot) {
      try {
        await updateDraft.mutateAsync({
          consultationId,
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
        if (!isStale()) {
          setOptimisticMessages((prev) => prev.filter((message) => message.id !== tempMessage.id))
          setStreamingMessage(null)
          setStreamingMatchId(null)
          setCandidatePending(false)
          setPending(false)
        }
        return
      }
    }
    try {
      await sendMessage.mutateAsync({
        consultationId,
        content,
        onDelta: (delta) => {
          if (!delta) return
          if (isStale()) return
          setStreamingMessage((prev) =>
            prev && prev.id === streamMessage.id
              ? { ...prev, content: `${prev.content}${delta}` }
              : prev,
          )
        },
        onDone: (payload) => {
          if (isStale()) return
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
          if (isStale()) return
          setStreamingMessage(null)
          setStreamingMatchId(null)
          setCandidatePending(false)
        },
      })
    } catch {
      if (!isStale()) {
        setOptimisticMessages((prev) => prev.filter((message) => message.id !== tempMessage.id))
        setStreamingMessage(null)
        setStreamingMatchId(null)
        setCandidatePending(false)
      }
    } finally {
      if (!isStale()) {
        setPending(false)
      }
    }
  }

  const handleAdoptDisease = async (disease: Disease) => {
    if (!consultationId || !draft || adoptedSummaryStream.isPending || adoptedPending) return
    const sessionToken = activeSessionRef.current
    const sessionConsultationId = consultationId
    const isStale = () =>
      activeSessionRef.current !== sessionToken || activeConsultationRef.current !== sessionConsultationId
    const adoptContent = `采纳病症：${disease.name}`
    const adoptMessage: CaseMessage = {
      id: `adopt-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      sender: 'doctor',
      content: adoptContent,
      createdAt: new Date().toISOString(),
    }
    setOptimisticMessages((prev) => [...prev, adoptMessage])
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
          if (isStale()) return
          setAdoptedStreamingMessage((prev) =>
            prev && prev.id === streamMessage.id
              ? { ...prev, content: `${prev.content}${delta}` }
              : prev,
          )
        },
        onDone: (payload) => {
          if (isStale()) return
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
          if (isStale()) return
          setAdoptedStreamingMessage(null)
          setAdoptedPending(false)
        },
      })
    } catch {
      if (!isStale()) {
        setAdoptedStreamingMessage(null)
        setAdoptedPending(false)
      }
    }
  }

  const handleRequestDecision = async () => {
    if (!consultationId || decisionStream.isPending || decisionPending) return
    const sessionToken = activeSessionRef.current
    const sessionConsultationId = consultationId
    const isStale = () =>
      activeSessionRef.current !== sessionToken || activeConsultationRef.current !== sessionConsultationId
    const previousDecisionMessage = decisionStreamingMessage
    setDecisionReplyContent(null)
    setDecisionReplyId(null)
    setDecisionAdoptError(null)
    setDecisionPending(true)
    const streamMessage: CaseMessage = {
      id: `decision-stream-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      sender: 'model',
      content: '',
      createdAt: new Date().toISOString(),
      isStreaming: true,
    }
    setDecisionStreamingMessage(streamMessage)
    setDecisionReplyId(streamMessage.id)
    const draftSnapshot = draftSnapshotRef.current
    if (draftSnapshot) {
      try {
        await updateDraft.mutateAsync({
          consultationId,
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
        if (!isStale()) {
          setDecisionPending(false)
          setDecisionStreamingMessage(previousDecisionMessage)
        }
        return
      }
    }
    try {
      await decisionStream.mutateAsync({
        consultationId,
        message: null,
        onDelta: (delta) => {
          if (!delta) return
          if (isStale()) return
          setDecisionStreamingMessage((prev) =>
            prev && prev.id === streamMessage.id
              ? { ...prev, content: `${prev.content}${delta}` }
              : prev,
          )
        },
        onDone: (payload) => {
          if (isStale()) return
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
          setDecisionReplyContent(finalText || payloadReply || streamMessage.content)
          setDecisionReplyId(streamMessage.id)
        },
        onError: () => {
          if (isStale()) return
          setDecisionStreamingMessage(null)
          setDecisionReplyContent(null)
          setDecisionReplyId(null)
        },
      })
    } catch {
      if (!isStale()) {
        setDecisionStreamingMessage(null)
        setDecisionReplyContent(null)
        setDecisionReplyId(null)
      }
    } finally {
      if (!isStale()) {
        setDecisionPending(false)
      }
    }
  }

  const handleAdoptDecisionReply = async (content: string) => {
    if (!consultationId || !draft) return
    const sessionToken = activeSessionRef.current
    const sessionConsultationId = consultationId
    const isStale = () =>
      activeSessionRef.current !== sessionToken || activeConsultationRef.current !== sessionConsultationId
    const text = content.trim()
    if (!text) return
    setDecisionAdoptError(null)
    setDecisionAdopting(true)
    const previousDraft = draftSnapshotRef.current ?? draft
    try {
      const items = await extractDiseaseFormula.mutateAsync({ text })
      if (isStale()) return
      const extracted = items.find(
        (item) => (item.disease && item.disease.trim()) || (item.formula && item.formula.trim()),
      )
      if (!extracted) {
        setDecisionAdoptError('未提取到病症或方剂')
        return
      }
      const nextDiagnosis = extracted.disease?.trim() || draft.diagnosis
      const nextFormula = extracted.formula?.trim() || draft.formulaName
      const nextDraft: ConsultationDraft = {
        ...draft,
        diagnosis: nextDiagnosis,
        formulaName: nextFormula,
        status: {
          ...draft.status,
          diagnosis: extracted.disease?.trim() ? 'confirmed' : draft.status.diagnosis,
          formulaName: extracted.formula?.trim() ? 'confirmed' : draft.status.formulaName,
        },
        updatedAt: new Date().toISOString(),
      }
      draftSnapshotRef.current = nextDraft
      queryClient.setQueryData(['consultation', consultationId, 'draft'], nextDraft)
      try {
        const updated = await updateDraft.mutateAsync({
          consultationId,
          patch: {
            diagnosis: nextDiagnosis,
            formulaName: nextFormula,
          },
        })
        const normalized: ConsultationDraft = {
          ...updated,
          status: nextDraft.status,
        }
        draftSnapshotRef.current = normalized
        queryClient.setQueryData(['consultation', consultationId, 'draft'], normalized)
      } catch (error) {
        if (!isStale()) {
          setDecisionAdoptError(
            error instanceof Error ? error.message : '保存失败，请稍后重试',
          )
          queryClient.setQueryData(['consultation', consultationId, 'draft'], previousDraft)
          draftSnapshotRef.current = previousDraft
        }
      }
    } catch (error) {
      if (!isStale()) {
        setDecisionAdoptError(
          error instanceof Error ? error.message : '抽取失败，请稍后重试',
        )
      }
    } finally {
      if (!isStale()) {
        setDecisionAdopting(false)
      }
    }
  }

  const startNew = async () => {
    if (transcript.length === 0 && isDraftEmpty) {
      setNotice({ tone: 'info', message: '当前问诊为空，无需开启新问诊。' })
      return
    }
    forceNewRef.current = true
    localStorage.removeItem(lastConsultationStorageKey)
    if (consultationId) {
      clearCachedSuggestion(consultationId)
      clearReasoningState(consultationId)
      void queryClient.removeQueries({ queryKey: ['case', consultationId], exact: false })
      void queryClient.removeQueries({ queryKey: ['consultation', consultationId], exact: false })
    }
    setConsultationId(null)
    setOptimisticMessages([])
    setStreamingMessage(null)
    setStreamingMatchId(null)
    setDecisionStreamingMessage(null)
    setAdoptedStreamingMessage(null)
    setCandidatePending(false)
    setDecisionPending(false)
    setAdoptedPending(false)
    setReasoningConfirmedSymptoms([])
    candidateSnapshotRef.current = null
    draftSnapshotRef.current = null
    setPending(false)
    setInput('')
    try {
      await requestNewConsultation()
    } catch {
      // ignore
    }
  }

  const isAdoptedResponse =
    Boolean(latestModelMessage?.adoptedSummary) ||
    latestModelId === adoptedStreamingMessage?.id ||
    latestAdoptedReply
  const suppressCandidatePanel =
    Boolean(latestModelMessage?.content.includes('模型自主分析')) ||
    adoptedPending ||
    isAdoptedResponse
  const isThinking = pending && !streamingMessage?.content
  const canShowCandidatePanel =
    Boolean(consultationId) &&
    (candidatePending || transcript.length > 0) &&
    !isThinking &&
    !decisionPending &&
    !suppressCandidatePanel
  const candidatePanel = canShowCandidatePanel ? (
    <ConsultationCandidatePanel
      suggestion={suggestion}
      catalog={catalog}
      decisionLoading={decisionStream.isPending}
      candidateLoading={candidatePending}
      onConfirmedSymptomsChange={handleConfirmedSymptomsChange}
      storageKey={consultationId ?? undefined}
      onRequestDecision={consultationId ? () => void handleRequestDecision() : undefined}
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

  const normalizedDecisionContent = decisionReplyContent?.trim() || null
  const buildMessageFooter = (message: CaseMessage) => {
    const matchesDecisionReply =
      Boolean(normalizedDecisionContent) &&
      message.sender === 'model' &&
      !message.isStreaming &&
      (message.id === decisionReplyId || message.content.trim() === normalizedDecisionContent)
    const decisionFooter = matchesDecisionReply ? (
      <DecisionAdoptAction
        loading={decisionAdopting}
        error={decisionAdoptError}
        onAdopt={() => void handleAdoptDecisionReply(message.content)}
      />
    ) : null
    const candidateFooter =
      message.id === latestModelId &&
      message.sender === 'model' &&
      canShowInlineCandidatePanel &&
      !message.adoptedSummary
        ? candidatePanel
        : null
    if (!decisionFooter && !candidateFooter) return null
    if (decisionFooter && candidateFooter) {
      return (
        <div className="space-y-2">
          {decisionFooter}
          {candidateFooter}
        </div>
      )
    }
    return decisionFooter ?? candidateFooter
  }

  return (
    <div className="relative flex h-full flex-1 min-h-0 pb-0">
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
                      hideTimestamp={Boolean(m.isStreaming)}
                      footer={buildMessageFooter(m)}
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
                  {decisionPending && !decisionStreamingMessage?.content ? (
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
                  {adoptedPending && !adoptedStreamingMessage?.content ? (
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
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
              {notice ? <InlineNotice tone={notice.tone} message={notice.message} /> : null}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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

      <div className="pointer-events-none fixed inset-x-0 bottom-1 px-4 text-center text-[11px] leading-tight text-slate-400 sm:bottom-2 z-30">
        本系统是针对专业医生提供的问诊辅助，不对普通用户构成建议
      </div>
    </div>
  )
}
