type ReasoningSnapshot = {
  answers?: Array<{
    answer?: 'yes' | 'no'
    symptom?: string
  }>
}

type ConfirmedSnapshot = {
  symptoms?: string[]
}

const confirmedKey = (storageKey: string) => `consultation-reasoning-confirmed:${storageKey}`

export function readReasoningConfirmedSymptoms(storageKey: string) {
  if (typeof window === 'undefined') return []
  try {
    const confirmedRaw = window.localStorage.getItem(confirmedKey(storageKey))
    if (confirmedRaw) {
      const confirmedSnapshot = JSON.parse(confirmedRaw) as ConfirmedSnapshot
      if (
        confirmedSnapshot &&
        Array.isArray(confirmedSnapshot.symptoms) &&
        confirmedSnapshot.symptoms.length > 0
      ) {
        return dedupeSymptoms(confirmedSnapshot.symptoms)
      }
    }
    const raw = window.localStorage.getItem(`consultation-reasoning:${storageKey}`)
    if (!raw) return []
    const snapshot = JSON.parse(raw) as ReasoningSnapshot
    if (!snapshot || !Array.isArray(snapshot.answers)) return []
    const symptoms = snapshot.answers
      .filter((item) => item.answer === 'yes' && typeof item.symptom === 'string')
      .map((item) => item.symptom as string)
    return dedupeSymptoms(symptoms)
  } catch {
    return []
  }
}

export function writeReasoningConfirmedSymptoms(storageKey: string, symptoms: string[]) {
  if (typeof window === 'undefined') return
  const cleaned = dedupeSymptoms(symptoms)
  try {
    if (cleaned.length === 0) {
      window.localStorage.removeItem(confirmedKey(storageKey))
      return
    }
    const snapshot: ConfirmedSnapshot = { symptoms: cleaned }
    window.localStorage.setItem(confirmedKey(storageKey), JSON.stringify(snapshot))
  } catch {
    // ignore storage errors
  }
}

export function clearReasoningState(storageKey?: string) {
  if (!storageKey || typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(confirmedKey(storageKey))
    window.localStorage.removeItem(`consultation-reasoning:${storageKey}`)
  } catch {
    // ignore storage errors
  }
}

export function dedupeSymptoms(items: string[]) {
  const seen = new Set<string>()
  const result: string[] = []
  items.forEach((item) => {
    if (!item || seen.has(item)) return
    seen.add(item)
    result.push(item)
  })
  return result
}
