import { useMemo, useState } from 'react'
import type { ConsultationCandidateDisease, ConsultationDecision, ConsultationSuggestion, Disease } from '../types'
import { DiseaseDetailModal } from './DiseaseDetailModal'

export function ConsultationCandidatePanel({
  suggestion,
  catalog,
  decision,
  decisionReply,
  decisionLoading,
  candidateLoading,
  onRequestDecision,
  onAdoptDecision,
  onAdoptDisease,
}: {
  suggestion?: ConsultationSuggestion
  catalog?: Disease[]
  decision?: ConsultationDecision | null
  decisionReply?: string
  decisionLoading?: boolean
  candidateLoading?: boolean
  onRequestDecision?: () => void
  onAdoptDecision?: (decision: ConsultationDecision) => void
  onAdoptDisease?: (disease: Disease, candidate: ConsultationCandidateDisease) => void
}) {
  const [showAll, setShowAll] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState<ConsultationCandidateDisease | null>(null)

  const candidates = suggestion?.candidateDiseases ?? []
  const visibleCandidates = showAll ? candidates : candidates.slice(0, 5)
  const hasMore = candidates.length > 5
  const diseaseMap = useMemo(() => {
    const map = new Map<string, Disease>()
    ;(catalog ?? []).forEach((item) => map.set(item.id, item))
    return map
  }, [catalog])
  const selectedDisease = selectedCandidate ? diseaseMap.get(selectedCandidate.id) : undefined

  return (
    <div className="rounded-xl bg-slate-100/80 px-3 py-2 text-xs text-slate-600">
      {candidateLoading ? (
        <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-transparent" />
          候选病症计算中
        </div>
      ) : null}
      {!candidateLoading && visibleCandidates.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-slate-500">候选病症：</span>
          {visibleCandidates.map((item) => (
            <button
              key={`${item.id}-${item.name}`}
              type="button"
              onClick={() => setSelectedCandidate(item)}
              className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-700 transition hover:border-primary-200 hover:text-primary-700"
            >
              {item.name} {formatProbability(item.probability)}
            </button>
          ))}
          {hasMore ? (
            <button
              type="button"
              onClick={() => setShowAll((prev) => !prev)}
              className="text-xs font-semibold text-primary-600 hover:text-primary-700"
            >
              {showAll ? '收起' : '显示更多'}
            </button>
          ) : null}
        </div>
      ) : !candidateLoading ? (
        <div className="text-xs text-slate-500">未检索到合适的候选病症</div>
      ) : null}

      {onRequestDecision ? (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onRequestDecision}
            disabled={decisionLoading}
            className="text-xs font-semibold text-slate-600 underline decoration-dotted underline-offset-2 hover:text-primary-700 disabled:opacity-60"
          >
            让模型决策
          </button>
          {decisionLoading ? <span className="text-xs text-slate-400">模型决策中...</span> : null}
        </div>
      ) : null}

      {decision || decisionReply ? (
        <div className="mt-2 space-y-1">
          {decisionReply ? <p className="whitespace-pre-wrap text-slate-600">{decisionReply}</p> : null}
          {decision ? (
            <p className="text-slate-600">
              可能的疾病名称：{decision.diseaseName}；方剂：{decision.prescription}
            </p>
          ) : null}
          {decision && onAdoptDecision ? (
            <button
              type="button"
              onClick={() => onAdoptDecision(decision)}
              className="text-xs font-semibold text-primary-600 hover:text-primary-700"
            >
              采纳
            </button>
          ) : null}
        </div>
      ) : null}

      <DiseaseDetailModal
        open={Boolean(selectedCandidate)}
        disease={selectedDisease}
        onClose={() => setSelectedCandidate(null)}
        onConfirm={
          selectedDisease && selectedCandidate && onAdoptDisease
            ? () => {
                onAdoptDisease(selectedDisease, selectedCandidate)
                setSelectedCandidate(null)
              }
            : undefined
        }
      />
    </div>
  )
}

function formatProbability(value?: number) {
  if (value == null || Number.isNaN(value)) return '—'
  const rounded = Math.round(value)
  return `${rounded}%`
}
