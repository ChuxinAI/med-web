import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  useCaseMessages,
  useCaseSuggestions,
  useCatalog,
  useConsultationDialogue,
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
import type { CaseMessage, ConsultationDecision, ConsultationDialogue, Disease } from '../types'

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
  const dialogue = useConsultationDialogue()

  const [optimisticMessages, setOptimisticMessages] = useState<CaseMessage[]>([])
  const [streamingMessage, setStreamingMessage] = useState<CaseMessage | null>(null)
  const [decisionResult, setDecisionResult] = useState<ConsultationDialogue | null>(null)
  const [candidatePending, setCandidatePending] = useState(false)
  const candidateSnapshotRef = useRef<typeof suggestion | null>(null)

  useEffect(() => {
    setOptimisticMessages([])
    setStreamingMessage(null)
    setDecisionResult(null)
    setCandidatePending(false)
    candidateSnapshotRef.current = null
  }, [activeId])

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

  useEffect(() => {
    if (!candidatePending) return
    if (suggestion !== candidateSnapshotRef.current) {
      setCandidatePending(false)
    }
  }, [candidatePending, suggestion])

  const suggestedSymptoms = useMemo(() => suggestion?.confirmedSymptoms ?? [], [suggestion?.confirmedSymptoms])

  const groupedMessages = useMemo(
    () =>
      (messages ?? [])
        .concat(optimisticMessages)
        .concat(streamingMessage && streamingMessage.content ? [streamingMessage] : [])
        .slice()
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [messages, optimisticMessages, streamingMessage],
  )

  const latestAssistantId = useMemo(() => {
    for (let i = groupedMessages.length - 1; i >= 0; i -= 1) {
      if (groupedMessages[i].sender !== 'doctor') return groupedMessages[i].id
    }
    return null
  }, [groupedMessages])

  const [input, setInput] = useState('')
  const [casePanelOpen, setCasePanelOpen] = useState(false)

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
    const streamMessage: CaseMessage = {
      id: `stream-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      sender: 'model',
      content: '',
      createdAt: new Date().toISOString(),
      isStreaming: true,
    }
    setStreamingMessage(streamMessage)
    setDecisionResult(null)
    setInput('')
    candidateSnapshotRef.current = suggestion ?? null
    setCandidatePending(true)
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
          setCandidatePending(false)
        },
      })
    } catch {
      setOptimisticMessages((prev) => prev.filter((message) => message.id !== tempMessage.id))
      setStreamingMessage(null)
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
        status: {
          ...draft.status,
          diagnosis: 'confirmed',
          formulaName: 'confirmed',
        },
      },
    })
  }

  const handleAdoptDecision = async (decision: ConsultationDecision) => {
    if (!activeId || !draft) return
    await updateDraft.mutateAsync({
      consultationId: activeId,
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

  const caseBuilder = !draft || !activeId ? (
    <div className="text-slate-600">正在加载草稿...</div>
  ) : (
    <CaseBuilderPanel
      consultationId={activeId}
      draft={draft}
      patients={patients ?? []}
      suggestedSymptoms={suggestedSymptoms}
      saving={updateDraft.isPending}
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
                  hideTimestamp={Boolean(streamingMessage && m.id === streamingMessage.id)}
                  footer={
                    m.id === latestAssistantId && m.sender !== 'doctor' ? (
                    <ConsultationCandidatePanel
                      suggestion={suggestion}
                      catalog={catalog}
                      decision={decisionResult?.decision ?? null}
                      decisionReply={decisionResult?.reply}
                      decisionLoading={dialogue.isPending}
                        candidateLoading={candidatePending}
                        onRequestDecision={
                          activeId
                            ? () =>
                                dialogue
                                  .mutateAsync({
                                    consultationId: activeId,
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
