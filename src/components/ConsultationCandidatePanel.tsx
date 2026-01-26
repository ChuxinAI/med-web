import { useEffect, useMemo, useRef, useState } from 'react'
import type {
  ConsultationCandidateDisease,
  ConsultationCandidateSymptomDetail,
  ConsultationReasoningTree,
  ConsultationSuggestion,
  Disease,
} from '../types'
import { DiseaseDetailModal } from './DiseaseDetailModal'
import { readReasoningConfirmedSymptoms } from '../lib/reasoningStorage'

type CandidateSymptomDetailWithPartial = ConsultationCandidateSymptomDetail & {
  symptoms: string[]
}

export function ConsultationCandidatePanel({
  suggestion,
  catalog,
  decisionLoading,
  candidateLoading,
  onRequestDecision,
  onAdoptDisease,
  onConfirmedSymptomsChange,
  storageKey,
  readOnly = false,
}: {
  suggestion?: ConsultationSuggestion
  catalog?: Disease[]
  decisionLoading?: boolean
  candidateLoading?: boolean
  onRequestDecision?: () => void
  onAdoptDisease?: (disease: Disease, candidate: ConsultationCandidateDisease) => void
  onConfirmedSymptomsChange?: (symptoms: string[]) => void
  storageKey?: string
  readOnly?: boolean
}) {
  const [selectedCandidate, setSelectedCandidate] = useState<ConsultationCandidateDisease | null>(null)
  const [currentNode, setCurrentNode] = useState<ConsultationReasoningTree | null>(null)
  const [history, setHistory] = useState<ReasoningHistoryItem[]>([])
  const [yesSymptoms, setYesSymptoms] = useState<string[]>([])
  const [noSymptoms, setNoSymptoms] = useState<string[]>([])
  const hasHydratedRef = useRef(false)
  const hasUserInteractedRef = useRef(false)

  const candidates = suggestion?.candidateDiseases ?? []
  const reasoningTree = suggestion?.reasoningTree ?? null
  const normalizedUserSymptoms = suggestion?.normalizedUserSymptoms ?? []
  const candidateSymptomDetails = suggestion?.candidateSymptomDetails ?? []
  const candidateIdFilter = useMemo(() => {
    if (!currentNode?.candidateIds?.length) return null
    return new Set(currentNode.candidateIds.map((id) => String(id)))
  }, [currentNode?.candidateIds])
  const confirmedSymptoms = useMemo(
    () => dedupeSymptoms([...normalizedUserSymptoms, ...yesSymptoms]),
    [normalizedUserSymptoms, yesSymptoms],
  )
  const diseaseMap = useMemo(() => {
    const map = new Map<string, Disease>()
    ;(catalog ?? []).forEach((item) => map.set(item.id, item))
    return map
  }, [catalog])
  const selectedDisease = selectedCandidate ? diseaseMap.get(selectedCandidate.id) : undefined
  const candidateMatchedMap = useMemo(() => {
    const map = new Map<string, string[]>()
    candidates.forEach((item) => {
      if (item.matchedSymptoms && item.matchedSymptoms.length > 0) {
        map.set(item.id, item.matchedSymptoms)
      }
    })
    return map
  }, [candidates])
  const symptomDetailMap = useMemo(() => {
    const noSet = new Set(noSymptoms)
    const map = new Map<string, CandidateSymptomDetailWithPartial>()
    candidateSymptomDetails.forEach((detail) => {
      const symptoms = mergeSymptoms(detail.symptoms ?? [], detail.matchedSymptoms, detail.unmatchedSymptoms)
      const baseMatched =
        normalizedUserSymptoms.length > 0
          ? normalizedUserSymptoms
          : [...detail.matchedSymptoms, ...(candidateMatchedMap.get(detail.id) ?? [])]
      const confirmed = dedupeSymptoms([...baseMatched, ...yesSymptoms])
      const yesSet = new Set(confirmed)
      const matchedSymptoms = symptoms.filter((symptom) => yesSet.has(symptom))
      const unmatchedSymptoms = symptoms.filter((symptom) => !yesSet.has(symptom) && !noSet.has(symptom))
      map.set(detail.id, {
        ...detail,
        symptoms,
        matchedSymptoms,
        unmatchedSymptoms,
      })
    })
    return map
  }, [candidateMatchedMap, candidateSymptomDetails, normalizedUserSymptoms, noSymptoms, yesSymptoms])
  const filteredCandidates = useMemo(() => {
    const source = candidateIdFilter ? candidates.filter((item) => candidateIdFilter.has(item.id)) : candidates
    return source.slice().sort((a, b) => {
      const scoreA = resolveProbability(a, symptomDetailMap, confirmedSymptoms, diseaseMap)
      const scoreB = resolveProbability(b, symptomDetailMap, confirmedSymptoms, diseaseMap)
      if (scoreB !== scoreA) return scoreB - scoreA
      return a.name.localeCompare(b.name, 'zh-Hans-CN')
    })
  }, [candidateIdFilter, candidates, confirmedSymptoms, diseaseMap, symptomDetailMap])
  const visibleCandidates = filteredCandidates
  const selectedSymptomDetail = selectedCandidate ? symptomDetailMap.get(selectedCandidate.id) : undefined
  const askedSet = useMemo(
    () => new Set([...normalizedUserSymptoms, ...yesSymptoms, ...noSymptoms]),
    [normalizedUserSymptoms, noSymptoms, yesSymptoms],
  )
  const fallbackAskSymptom = useMemo(
    () => pickNextSymptom(filteredCandidates, symptomDetailMap, askedSet),
    [askedSet, filteredCandidates, symptomDetailMap],
  )
  const activeAskSymptom = currentNode?.askSymptom ?? fallbackAskSymptom ?? null
  const isTreeAsk = Boolean(currentNode?.askSymptom)
  const persistenceKey = storageKey ? `consultation-reasoning:${storageKey}` : null
  const baseCandidateKey = useMemo(() => {
    if (candidates.length === 0) return null
    return candidates
      .map((item) => item.id)
      .slice()
      .sort()
      .join('|')
  }, [candidates])

  useEffect(() => {
    hasHydratedRef.current = false
    hasUserInteractedRef.current = false
  }, [persistenceKey])

  useEffect(() => {
    if (!persistenceKey || !baseCandidateKey) {
      setCurrentNode(reasoningTree)
      setHistory([])
      setYesSymptoms([])
      setNoSymptoms([])
      hasHydratedRef.current = true
      return
    }
    const restored = restoreReasoningState(persistenceKey, reasoningTree, baseCandidateKey)
    if (restored) {
      setCurrentNode(restored.currentNode)
      setHistory(restored.history)
      setYesSymptoms(restored.yesSymptoms)
      setNoSymptoms(restored.noSymptoms)
      hasHydratedRef.current = true
      return
    }
    const storedConfirmed = storageKey ? readReasoningConfirmedSymptoms(storageKey) : []
    const seededYes =
      storedConfirmed.length > 0
        ? storedConfirmed.filter((item) => !normalizedUserSymptoms.includes(item))
        : []
    setCurrentNode(reasoningTree)
    setHistory([])
    setYesSymptoms(seededYes)
    setNoSymptoms([])
    hasHydratedRef.current = true
  }, [baseCandidateKey, normalizedUserSymptoms, persistenceKey, reasoningTree, storageKey])

  useEffect(() => {
    if (!hasHydratedRef.current) return
    if (!hasUserInteractedRef.current && confirmedSymptoms.length === 0) return
    onConfirmedSymptomsChange?.(confirmedSymptoms)
  }, [confirmedSymptoms, onConfirmedSymptomsChange])

  useEffect(() => {
    if (!hasHydratedRef.current) return
    if (!persistenceKey || !baseCandidateKey) return
    if (!hasUserInteractedRef.current && history.length === 0) return
    persistReasoningState(persistenceKey, baseCandidateKey, history)
  }, [baseCandidateKey, history, persistenceKey])

  const handleAnswer = (answer: 'yes' | 'no') => {
    if (readOnly) return
    if (!activeAskSymptom) return
    hasUserInteractedRef.current = true
    const symptom = activeAskSymptom
    if (isTreeAsk && currentNode?.askSymptom) {
      const next = answer === 'yes' ? currentNode.yes : currentNode.no
      if (!next) return
      setHistory((prev) => [...prev, { node: currentNode, answer, symptom, mode: 'tree' }])
      setCurrentNode(next)
    } else {
      setHistory((prev) => [...prev, { node: currentNode, answer, symptom, mode: 'fallback' }])
    }
    if (answer === 'yes') {
      setYesSymptoms((prev) => [...prev, symptom])
    } else {
      setNoSymptoms((prev) => [...prev, symptom])
    }
  }

  const handleBack = () => {
    if (readOnly) return
    hasUserInteractedRef.current = true
    setHistory((prev) => {
      if (prev.length === 0) return prev
      const last = prev[prev.length - 1]
      setCurrentNode(last.node ?? null)
      if (last.answer === 'yes') {
        setYesSymptoms((items) => removeLast(items, last.symptom))
      } else {
        setNoSymptoms((items) => removeLast(items, last.symptom))
      }
      return prev.slice(0, -1)
    })
  }

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
              {item.name}{' '}
              {formatProbability(resolveProbability(item, symptomDetailMap, confirmedSymptoms, diseaseMap))}
            </button>
          ))}
        </div>
      ) : !candidateLoading ? (
        <div className="text-xs text-slate-500">未检索到合适的候选病症</div>
      ) : null}

      {!candidateLoading && (currentNode || fallbackAskSymptom) ? (
        <div className="mt-2 rounded-lg border border-slate-200/60 bg-white/70 px-2 py-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-500">推理选择</span>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span>候选数 {filteredCandidates.length}</span>
              <button
                type="button"
                onClick={handleBack}
                disabled={readOnly || history.length === 0}
                className="text-[11px] font-semibold text-slate-500 underline decoration-dotted underline-offset-2 disabled:opacity-40"
              >
                回退
              </button>
            </div>
          </div>
          {activeAskSymptom ? (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <span>是否存在「{activeAskSymptom}」？</span>
              <button
                type="button"
                onClick={() => handleAnswer('yes')}
                disabled={readOnly || (isTreeAsk && !currentNode?.yes)}
                className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 disabled:opacity-50"
              >
                是
              </button>
              <button
                type="button"
                onClick={() => handleAnswer('no')}
                disabled={readOnly || (isTreeAsk && !currentNode?.no)}
                className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-600 disabled:opacity-50"
              >
                否
              </button>
            </div>
          ) : (
            <div className="mt-2 text-[11px] text-slate-400">暂无可继续收敛的症状。</div>
          )}
          {(confirmedSymptoms.length > 0 || noSymptoms.length > 0) && (
            <div className="mt-2 space-y-1 text-[11px] text-slate-500">
              {confirmedSymptoms.length > 0 ? <div>已确认：{confirmedSymptoms.join('、')}</div> : null}
              {noSymptoms.length > 0 ? <div>已否认：{noSymptoms.join('、')}</div> : null}
            </div>
          )}
        </div>
      ) : null}

      {onRequestDecision && !readOnly ? (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onRequestDecision}
            disabled={decisionLoading || candidateLoading}
            className="text-xs font-semibold text-slate-600 underline decoration-dotted underline-offset-2 hover:text-primary-700 disabled:opacity-60"
          >
            让模型决策
          </button>
        </div>
      ) : null}


      <DiseaseDetailModal
        open={Boolean(selectedCandidate)}
        disease={selectedDisease}
        matchedSymptoms={selectedSymptomDetail?.matchedSymptoms}
        unmatchedSymptoms={selectedSymptomDetail?.unmatchedSymptoms}
        confirmedSymptoms={confirmedSymptoms}
        onClose={() => setSelectedCandidate(null)}
        onConfirm={
          selectedDisease && selectedCandidate && onAdoptDisease && !readOnly
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

function resolveProbability(
  candidate: ConsultationCandidateDisease,
  symptomDetailMap: Map<string, CandidateSymptomDetailWithPartial>,
  confirmedSymptoms: string[],
  diseaseMap: Map<string, Disease>,
) {
  const detail = symptomDetailMap.get(candidate.id)
  const candidateSymptoms = detail ? expandSymptoms(detail.symptoms) : []
  const diseaseSymptomsText = diseaseMap.get(candidate.id)?.symptoms ?? ''
  const fallbackSymptoms = diseaseSymptomsText ? expandSymptoms([diseaseSymptomsText]) : []
  const resolvedCandidateSymptoms =
    candidateSymptoms.length <= 1 && fallbackSymptoms.length > candidateSymptoms.length
      ? fallbackSymptoms
      : candidateSymptoms
  if (resolvedCandidateSymptoms.length === 0) return candidate.probability
  const userSymptoms = expandSymptoms(confirmedSymptoms)
  if (userSymptoms.length === 0) return 0
  const totalScore = resolvedCandidateSymptoms.reduce((sum, symptom) => {
    return sum + resolveSymptomMatchScore(symptom, userSymptoms)
  }, 0)
  const ratio = totalScore / resolvedCandidateSymptoms.length
  if (!Number.isFinite(ratio)) return candidate.probability
  return Math.max(0, Math.min(100, ratio * 100))
}

function removeLast(list: string[], value: string) {
  const index = list.lastIndexOf(value)
  if (index < 0) return list
  return list.slice(0, index).concat(list.slice(index + 1))
}

function pickNextSymptom(
  candidates: ConsultationCandidateDisease[],
  symptomDetailMap: Map<string, CandidateSymptomDetailWithPartial>,
  askedSet: Set<string>,
) {
  for (const candidate of candidates) {
    const detail = symptomDetailMap.get(candidate.id)
    if (!detail) continue
    const next = detail.unmatchedSymptoms.find((symptom) => !askedSet.has(symptom))
    if (next) return next
  }
  return null
}

function resolveSymptomMatchScore(candidateSymptom: string, userSymptoms: string[]) {
  const candidate = normalizeSymptom(candidateSymptom)
  if (!candidate) return 0
  let best = 0
  for (const rawUser of userSymptoms) {
    const user = normalizeSymptom(rawUser)
    if (!user) continue
    if (user === candidate) return 1
    if (user.includes(candidate)) return 1
    if (candidate.includes(user)) {
      best = Math.max(best, user.length / candidate.length)
      continue
    }
    const overlap = longestCommonSubstringLength(candidate, user)
    if (overlap > 0) {
      best = Math.max(best, overlap / candidate.length)
    }
  }
  return best
}

function expandSymptoms(list: string[]) {
  const items: string[] = []
  list.forEach((entry) => {
    const parts = splitSymptomText(entry)
    if (parts.length > 0) {
      items.push(...parts)
    }
  })
  return dedupeSymptoms(items.map(normalizeSymptom).filter(Boolean))
}

function splitSymptomText(text: string) {
  if (!text) return []
  return text
    .split(/[、，,。.;；\s]+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function normalizeSymptom(text: string) {
  return text.trim().replace(/\s+/g, ' ')
}

function longestCommonSubstringLength(a: string, b: string) {
  if (!a || !b) return 0
  const aLen = a.length
  const bLen = b.length
  const dp = new Array(bLen + 1).fill(0)
  let max = 0
  for (let i = 1; i <= aLen; i += 1) {
    let prev = 0
    const aChar = a[i - 1]
    for (let j = 1; j <= bLen; j += 1) {
      const temp = dp[j]
      if (aChar === b[j - 1]) {
        dp[j] = prev + 1
        if (dp[j] > max) max = dp[j]
      } else {
        dp[j] = 0
      }
      prev = temp
    }
  }
  return max
}

function mergeSymptoms(...lists: Array<string[] | undefined>) {
  const seen = new Set<string>()
  const result: string[] = []
  lists.forEach((list) => {
    if (!list) return
    list.forEach((item) => {
      if (!item || seen.has(item)) return
      seen.add(item)
      result.push(item)
    })
  })
  return result
}

function dedupeSymptoms(items: string[]) {
  const seen = new Set<string>()
  const result: string[] = []
  items.forEach((item) => {
    if (!item || seen.has(item)) return
    seen.add(item)
    result.push(item)
  })
  return result
}

type ReasoningHistoryItem = {
  node: ConsultationReasoningTree | null
  answer: 'yes' | 'no'
  symptom: string
  mode: 'tree' | 'fallback'
}

type ReasoningSnapshot = {
  baseCandidateKey: string
  answers: Array<Pick<ReasoningHistoryItem, 'answer' | 'symptom' | 'mode'>>
}

function persistReasoningState(
  key: string,
  baseCandidateKey: string,
  history: ReasoningHistoryItem[],
) {
  if (typeof window === 'undefined') return
  const snapshot: ReasoningSnapshot = {
    baseCandidateKey,
    answers: history.map((item) => ({ answer: item.answer, symptom: item.symptom, mode: item.mode })),
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(snapshot))
  } catch {
    // ignore storage errors
  }
}

function restoreReasoningState(
  key: string,
  reasoningTree: ConsultationReasoningTree | null,
  baseCandidateKey: string,
) {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(key)
  if (!raw) return null
  try {
    const snapshot = JSON.parse(raw) as ReasoningSnapshot
    if (!snapshot || !Array.isArray(snapshot.answers) || snapshot.answers.length === 0) return null
    const forceFallback = snapshot.baseCandidateKey !== baseCandidateKey || !reasoningTree
    return applyReasoningAnswers(reasoningTree, snapshot.answers, forceFallback)
  } catch {
    return null
  }
}

function applyReasoningAnswers(
  reasoningTree: ConsultationReasoningTree | null,
  answers: Array<Pick<ReasoningHistoryItem, 'answer' | 'symptom' | 'mode'>>,
  forceFallback = false,
) {
  let currentNode: ConsultationReasoningTree | null = forceFallback ? null : reasoningTree
  const history: ReasoningHistoryItem[] = []
  const yesSymptoms: string[] = []
  const noSymptoms: string[] = []
  let allowTree = !forceFallback
  for (const answer of answers) {
    if (answer.mode === 'tree' && allowTree) {
      if (!currentNode || currentNode.askSymptom !== answer.symptom) {
        allowTree = false
        currentNode = null
      } else {
        const next = answer.answer === 'yes' ? currentNode.yes : currentNode.no
        if (!next) {
          allowTree = false
          currentNode = null
        } else {
          history.push({
            node: currentNode,
            answer: answer.answer,
            symptom: answer.symptom,
            mode: 'tree',
          })
          currentNode = next
          if (answer.answer === 'yes') {
            yesSymptoms.push(answer.symptom)
          } else {
            noSymptoms.push(answer.symptom)
          }
          continue
        }
      }
    }
    history.push({
      node: currentNode,
      answer: answer.answer,
      symptom: answer.symptom,
      mode: 'fallback',
    })
    if (answer.answer === 'yes') {
      yesSymptoms.push(answer.symptom)
    } else {
      noSymptoms.push(answer.symptom)
    }
  }
  return {
    currentNode,
    history,
    yesSymptoms,
    noSymptoms,
  }
}
