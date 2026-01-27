import { useEffect, useMemo, useRef, useState } from 'react'
import type {
  ConsultationCandidateDisease,
  ConsultationCandidateSymptomDetail,
  ConsultationSuggestion,
  Disease,
} from '../types'
import { DiseaseDetailModal } from './DiseaseDetailModal'
import { readReasoningConfirmedSymptoms } from '../lib/reasoningStorage'

const MAX_REASONING_TURNS = 12

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
  const [history, setHistory] = useState<ReasoningHistoryItem[]>([])
  const [yesSymptoms, setYesSymptoms] = useState<string[]>([])
  const [noSymptoms, setNoSymptoms] = useState<string[]>([])
  const hasHydratedRef = useRef(false)
  const hasUserInteractedRef = useRef(false)

  const candidates = suggestion?.candidateDiseases ?? []
  const normalizedUserSymptoms = suggestion?.normalizedUserSymptoms ?? []
  const pendingSymptomGroups = useMemo(() => {
    const rawGroups = suggestion?.pendingSymptomGroups ?? []
    return rawGroups.map((group) => normalizeSymptomList(group)).filter((group) => group.length > 0)
  }, [suggestion?.pendingSymptomGroups])
  const pendingSymptoms = useMemo(
    () => normalizeSymptomList(suggestion?.pendingSymptoms ?? []),
    [suggestion?.pendingSymptoms],
  )
  const candidateSymptomDetails = suggestion?.candidateSymptomDetails ?? []
  const confirmedSymptoms = useMemo(
    () => dedupeSymptoms([...normalizedUserSymptoms, ...yesSymptoms]),
    [normalizedUserSymptoms, yesSymptoms],
  )
  const confirmedSet = useMemo(
    () => new Set(confirmedSymptoms.map(normalizeSymptom).filter(Boolean)),
    [confirmedSymptoms],
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
      const matchedSymptoms = mergeSymptoms(
        detail.matchedSymptoms ?? [],
        symptoms.filter((symptom) => yesSet.has(symptom)),
      )
      const computedUnmatched = symptoms.filter((symptom) => !yesSet.has(symptom) && !noSet.has(symptom))
      const backendUnmatched =
        (detail.unmatchedSymptoms ?? []).filter((symptom) => !yesSet.has(symptom) && !noSet.has(symptom))
      const unmatchedSymptoms = backendUnmatched.length > 0 ? backendUnmatched : computedUnmatched
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
    return candidates.slice().sort((a, b) => {
      const scoreA = resolveProbability(a, symptomDetailMap, confirmedSymptoms, diseaseMap)
      const scoreB = resolveProbability(b, symptomDetailMap, confirmedSymptoms, diseaseMap)
      if (scoreB !== scoreA) return scoreB - scoreA
      return a.name.localeCompare(b.name, 'zh-Hans-CN')
    })
  }, [candidates, confirmedSymptoms, diseaseMap, symptomDetailMap])
  const visibleCandidates = filteredCandidates
  const selectedSymptomDetail = selectedCandidate ? symptomDetailMap.get(selectedCandidate.id) : undefined
  const askedSet = useMemo(() => {
    const raw = [...normalizedUserSymptoms, ...yesSymptoms, ...noSymptoms]
    return new Set(raw.map(normalizeSymptom).filter(Boolean))
  }, [normalizedUserSymptoms, noSymptoms, yesSymptoms])
  const activeAskSymptom = useMemo(() => {
    if (history.length >= MAX_REASONING_TURNS) return null
    for (const group of pendingSymptomGroups) {
      if (group.some((symptom) => confirmedSet.has(symptom))) continue
      const nextSymptom = group.find((symptom) => !askedSet.has(symptom))
      if (nextSymptom) return nextSymptom
    }
    if (pendingSymptomGroups.length === 0) {
      const nextSymptom = pendingSymptoms.find((symptom) => !askedSet.has(symptom))
      if (nextSymptom) return nextSymptom
    }
    return null
  }, [askedSet, confirmedSet, history.length, pendingSymptomGroups, pendingSymptoms])
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
      setHistory([])
      setYesSymptoms([])
      setNoSymptoms([])
      hasHydratedRef.current = true
      return
    }
    const restored = restoreReasoningState(persistenceKey, baseCandidateKey)
    if (restored) {
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
    setHistory([])
    setYesSymptoms(seededYes)
    setNoSymptoms([])
    hasHydratedRef.current = true
  }, [baseCandidateKey, normalizedUserSymptoms, persistenceKey, storageKey])

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
    if (history.length >= MAX_REASONING_TURNS) return
    hasUserInteractedRef.current = true
    const symptom = activeAskSymptom
    setHistory((prev) => [...prev, { answer, symptom }])
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
              className={resolveCandidateClass(
                resolveProbability(item, symptomDetailMap, confirmedSymptoms, diseaseMap),
              )}
            >
              {item.name}{' '}
              {formatProbability(resolveProbability(item, symptomDetailMap, confirmedSymptoms, diseaseMap))}
            </button>
          ))}
        </div>
      ) : !candidateLoading ? (
        <div className="text-xs text-slate-500">未检索到合适的候选病症</div>
      ) : null}

      {!candidateLoading && candidates.length > 0 ? (
        <div className="mt-2 rounded-lg border border-slate-200/60 bg-white/70 px-2 py-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-500">推理选择</span>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span>候选数 {candidates.length}</span>
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
                disabled={readOnly}
                className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 disabled:opacity-50"
              >
                是
              </button>
              <button
                type="button"
                onClick={() => handleAnswer('no')}
                disabled={readOnly}
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
  const floored = Math.floor(value)
  return `${floored}%`
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

function normalizeSymptomList(list: string[]) {
  const seen = new Set<string>()
  const result: string[] = []
  list.forEach((item) => {
    const normalized = normalizeSymptom(item)
    if (!normalized || seen.has(normalized)) return
    seen.add(normalized)
    result.push(normalized)
  })
  return result
}

function resolveCandidateClass(probability?: number) {
  if (probability == null || Number.isNaN(probability)) {
    return 'rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-700 transition hover:border-primary-200 hover:text-primary-700'
  }
  if (probability >= 80) {
    return 'rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700 transition hover:border-emerald-300'
  }
  if (probability >= 60) {
    return 'rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs text-amber-700 transition hover:border-amber-300'
  }
  return 'rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-700 transition hover:border-primary-200 hover:text-primary-700'
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
  answer: 'yes' | 'no'
  symptom: string
}

type ReasoningSnapshot = {
  baseCandidateKey: string
  answers: Array<Pick<ReasoningHistoryItem, 'answer' | 'symptom'>>
}

function persistReasoningState(
  key: string,
  baseCandidateKey: string,
  history: ReasoningHistoryItem[],
) {
  if (typeof window === 'undefined') return
  const snapshot: ReasoningSnapshot = {
    baseCandidateKey,
    answers: history.map((item) => ({ answer: item.answer, symptom: item.symptom })),
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(snapshot))
  } catch {
    // ignore storage errors
  }
}

function restoreReasoningState(
  key: string,
  baseCandidateKey: string,
) {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(key)
  if (!raw) return null
  try {
    const snapshot = JSON.parse(raw) as ReasoningSnapshot
    if (!snapshot || !Array.isArray(snapshot.answers) || snapshot.answers.length === 0) return null
    if (snapshot.baseCandidateKey !== baseCandidateKey) {
      window.localStorage.removeItem(key)
      return null
    }
    return applyReasoningAnswers(snapshot.answers)
  } catch {
    return null
  }
}

function applyReasoningAnswers(
  answers: Array<Pick<ReasoningHistoryItem, 'answer' | 'symptom'>>,
) {
  const history: ReasoningHistoryItem[] = []
  const yesSymptoms: string[] = []
  const noSymptoms: string[] = []
  for (const answer of answers) {
    history.push({
      answer: answer.answer,
      symptom: answer.symptom,
    })
    if (answer.answer === 'yes') {
      yesSymptoms.push(answer.symptom)
    } else {
      noSymptoms.push(answer.symptom)
    }
  }
  return {
    history,
    yesSymptoms,
    noSymptoms,
  }
}
