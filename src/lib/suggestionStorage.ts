import type { ConsultationSuggestion } from '../types'

const suggestionKey = (caseId: string) => `consultation-suggestion:${caseId}`

export function isSuggestionMeaningful(suggestion?: ConsultationSuggestion) {
  if (!suggestion) return false
  if (suggestion.candidateDiseases && suggestion.candidateDiseases.length > 0) return true
  if (suggestion.candidateSymptomDetails && suggestion.candidateSymptomDetails.length > 0) return true
  if (suggestion.reasoningTree) return true
  if (suggestion.confirmedSymptoms && suggestion.confirmedSymptoms.length > 0) return true
  if (suggestion.normalizedUserSymptoms && suggestion.normalizedUserSymptoms.length > 0) return true
  return false
}

export function readCachedSuggestion(caseId?: string) {
  if (!caseId || typeof window === 'undefined') return undefined
  try {
    const raw = window.localStorage.getItem(suggestionKey(caseId))
    if (!raw) return undefined
    const parsed = JSON.parse(raw) as ConsultationSuggestion
    if (!isSuggestionMeaningful(parsed)) return undefined
    return parsed
  } catch {
    return undefined
  }
}

export function writeCachedSuggestion(caseId: string | undefined, suggestion?: ConsultationSuggestion) {
  if (!caseId || typeof window === 'undefined' || !suggestion) return
  if (!isSuggestionMeaningful(suggestion)) return
  try {
    window.localStorage.setItem(suggestionKey(caseId), JSON.stringify(suggestion))
  } catch {
    // ignore storage errors
  }
}
