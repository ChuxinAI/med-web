import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createConsultation,
  createDoctorPatient,
  updateDoctorPatient,
  fetchUsers,
  resetAdminUserPassword,
  setAdminUserStatus,
  updateAdminUser,
  deleteKnowledgeFile,
  fetchAuditLogs,
  fetchCaseDetails,
  fetchCaseMessages,
  fetchConsultationDraft,
  fetchCatalog,
  fetchDoctorCases,
  fetchDoctorPatients,
  fetchKnowledgeFiles,
  fetchMedicalCaseDetails,
  fetchMedicalCases,
  fetchPatientDetails,
  searchKnowledge,
  fetchSuggestions,
  login,
  createMedicalCaseFromConsultation,
  sendConsultationMessage,
  updateConsultationDraft,
  updateMedicalCase,
  uploadKnowledgeFiles,
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

export const useUpdateAdminUser = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (args: { userId: string; patch: Parameters<typeof updateAdminUser>[1] }) =>
      updateAdminUser(args.userId, args.patch),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })
}

export const useSetAdminUserStatus = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (args: { userId: string; status: Parameters<typeof setAdminUserStatus>[1] }) =>
      setAdminUserStatus(args.userId, args.status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })
}

export const useResetAdminUserPassword = () =>
  useMutation({ mutationFn: (args: { userId: string }) => resetAdminUserPassword(args.userId) })

export const useCatalog = () =>
  useQuery({ queryKey: ['catalog'], queryFn: fetchCatalog })

export const useAuditLogs = () =>
  useQuery({ queryKey: ['audits'], queryFn: fetchAuditLogs })

export const useKnowledgeFiles = () =>
  useQuery({ queryKey: ['admin', 'knowledge', 'files'], queryFn: fetchKnowledgeFiles })

export const useDeleteKnowledgeFile = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (args: { fileId: string }) => deleteKnowledgeFile(args.fileId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'knowledge', 'files'] })
    },
  })
}

export const useUploadKnowledgeFiles = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (args: { files: { name: string; size: number }[] }) => uploadKnowledgeFiles(args.files),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'knowledge', 'files'] })
    },
  })
}

export const useSearchKnowledge = (query: string) =>
  useQuery({
    queryKey: ['admin', 'knowledge', 'search', query],
    queryFn: () => searchKnowledge(query),
    enabled: query.trim().length > 0,
  })

export const useDoctorPatients = () =>
  useQuery({ queryKey: ['doctor', 'patients'], queryFn: fetchDoctorPatients })

export const useCreateDoctorPatient = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (args: Parameters<typeof createDoctorPatient>[0]) => createDoctorPatient(args),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['doctor', 'patients'] })
    },
  })
}

export const useUpdateDoctorPatient = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (args: { patientId: string; patch: Parameters<typeof updateDoctorPatient>[1] }) =>
      updateDoctorPatient(args.patientId, args.patch),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['doctor', 'patients'] })
      await queryClient.invalidateQueries({ queryKey: ['doctor', 'patients', variables.patientId] })
    },
  })
}

export const usePatientDetails = (patientId?: string) =>
  useQuery({
    queryKey: ['doctor', 'patients', patientId],
    queryFn: () => fetchPatientDetails(patientId ?? ''),
    enabled: Boolean(patientId),
  })

export const useMedicalCases = () =>
  useQuery({ queryKey: ['doctor', 'medicalCases'], queryFn: fetchMedicalCases })

export const useMedicalCaseDetails = (caseId?: string) =>
  useQuery({
    queryKey: ['doctor', 'medicalCases', caseId],
    queryFn: () => fetchMedicalCaseDetails(caseId ?? ''),
    enabled: Boolean(caseId),
  })

export const useUpdateMedicalCase = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (args: {
      caseId: string
      patch: Parameters<typeof updateMedicalCase>[1]
    }) => updateMedicalCase(args.caseId, args.patch),
    onSuccess: async (_data, variables) => {
      const { caseId } = variables
      await queryClient.invalidateQueries({ queryKey: ['doctor', 'medicalCases'] })
      await queryClient.invalidateQueries({ queryKey: ['doctor', 'medicalCases', caseId] })
    },
  })
}

export const useConsultationDraft = (consultationId?: string) =>
  useQuery({
    queryKey: ['consultation', consultationId, 'draft'],
    queryFn: () => fetchConsultationDraft(consultationId ?? ''),
    enabled: Boolean(consultationId),
  })

export const useUpdateConsultationDraft = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (args: {
      consultationId: string
      patch: Parameters<typeof updateConsultationDraft>[1]
    }) => updateConsultationDraft(args.consultationId, args.patch),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ['consultation', variables.consultationId, 'draft'],
      })
    },
  })
}

export const useSendConsultationMessage = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (args: { consultationId: string; content: string }) =>
      sendConsultationMessage(args.consultationId, args.content),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ['case', variables.consultationId, 'messages'],
      })
    },
  })
}

export const useCreateMedicalCaseFromConsultation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (args: { consultationId: string }) =>
      createMedicalCaseFromConsultation(args.consultationId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['doctor', 'medicalCases'] })
    },
  })
}

export const useCreateConsultation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (args: Parameters<typeof createConsultation>[0]) => createConsultation(args),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['cases'] })
    },
  })
}
