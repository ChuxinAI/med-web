import { useQuery } from '@tanstack/react-query'
import {
  fetchAuditLogs,
  fetchCaseDetails,
  fetchCaseMessages,
  fetchCatalog,
  fetchDoctorCases,
  fetchSuggestions,
  fetchUsers,
  login,
} from './mockApi'

export const useLogin = (username?: string, password?: string) =>
  useQuery({
    queryKey: ['login', username],
    queryFn: () => login(username ?? '', password ?? ''),
    enabled: false,
  })

export const useDoctorCases = () =>
  useQuery({ queryKey: ['cases'], queryFn: fetchDoctorCases })

export const useCaseDetails = (caseId?: string) =>
  useQuery({
    queryKey: ['case', caseId],
    queryFn: () => fetchCaseDetails(caseId ?? ''),
    enabled: Boolean(caseId),
  })

export const useCaseMessages = (caseId?: string) =>
  useQuery({
    queryKey: ['case', caseId, 'messages'],
    queryFn: () => fetchCaseMessages(caseId ?? ''),
    enabled: Boolean(caseId),
  })

export const useCaseSuggestions = (caseId?: string) =>
  useQuery({
    queryKey: ['case', caseId, 'suggestions'],
    queryFn: () => fetchSuggestions(caseId ?? ''),
    enabled: Boolean(caseId),
  })

export const useAdminUsers = () =>
  useQuery({ queryKey: ['admin', 'users'], queryFn: fetchUsers })

export const useCatalog = () =>
  useQuery({ queryKey: ['catalog'], queryFn: fetchCatalog })

export const useAuditLogs = () =>
  useQuery({ queryKey: ['audits'], queryFn: fetchAuditLogs })
