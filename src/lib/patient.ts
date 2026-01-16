import type { Patient } from '../types'

function parseBirthday(birthday?: string) {
  if (!birthday) return null
  const trimmed = birthday.trim()
  if (!trimmed) return null
  const parts = trimmed.split('-').map((v) => Number(v))
  if (parts.length !== 3) return null
  const [y, m, d] = parts
  if (!y || !m || !d) return null
  const date = new Date(y, m - 1, d)
  if (Number.isNaN(date.getTime())) return null
  return { y, m, d, date }
}

export function getPatientAge(patient: Pick<Patient, 'birthday' | 'age'>): number | null {
  const birth = parseBirthday(patient.birthday)
  if (birth) {
    const now = new Date()
    let age = now.getFullYear() - birth.y
    const hasHadBirthdayThisYear =
      now.getMonth() + 1 > birth.m || (now.getMonth() + 1 === birth.m && now.getDate() >= birth.d)
    if (!hasHadBirthdayThisYear) age -= 1
    if (age < 0) return null
    if (age > 130) return null
    return age
  }
  if (typeof patient.age === 'number' && Number.isFinite(patient.age) && patient.age >= 0) return patient.age
  return null
}

