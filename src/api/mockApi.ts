import type {
  AuditLogEntry,
  CaseDetails,
  CaseMessage,
  CaseSummary,
  CatalogEntry,
  ConsultationSuggestion,
  UserRole,
  UserSummary,
} from '../types'
import {
  mockAuditLogs,
  mockCaseDetails,
  mockCases,
  mockCatalog,
  mockMessages,
  mockSuggestions,
  mockUsers,
} from './mockData'

const wait = (ms = 220) => new Promise((resolve) => setTimeout(resolve, ms))

export async function login(
  username: string,
  _password: string,
): Promise<{ token: string; role: UserRole }> {
  await wait()
  const matched = mockUsers.find((u) => u.name === username)
  return {
    token: 'mock-token-' + Date.now(),
    role: matched?.role ?? 'doctor',
  }
}

export async function fetchDoctorCases(): Promise<CaseSummary[]> {
  await wait()
  return mockCases
}

export async function fetchCaseDetails(id: string): Promise<CaseDetails> {
  await wait()
  const detail = mockCaseDetails[id]
  if (!detail) throw new Error('未找到病例')
  return detail
}

export async function fetchCaseMessages(id: string): Promise<CaseMessage[]> {
  await wait()
  return mockMessages[id] ?? []
}

export async function fetchSuggestions(
  id: string,
): Promise<ConsultationSuggestion | undefined> {
  await wait()
  return mockSuggestions[id]
}

export async function fetchUsers(): Promise<UserSummary[]> {
  await wait()
  return mockUsers
}

export async function fetchCatalog(): Promise<CatalogEntry[]> {
  await wait()
  return mockCatalog
}

export async function fetchAuditLogs(): Promise<AuditLogEntry[]> {
  await wait()
  return mockAuditLogs
}
