import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createConsultation,
  createDisease,
  createDoctorPatient,
  createAdminUser,
  deleteConsultation,
  deleteDisease,
  deleteDoctorPatient,
  fetchAdminConsultations,
  fetchAdminPatients,
  fetchAdminStats,
  fetchCaseDetails,
  fetchCaseMessages,
  fetchCatalog,
  fetchConsultationDraft,
  fetchDiseases,
  fetchDiseasesPage,
  fetchDoctorCases,
  fetchDoctorPatients,
  fetchPatientDetails,
  fetchSuggestions,
  fetchUsers,
  importDiseasesFromFile,
  resetAdminUserPassword,
  sendConsultationDialogue,
  sendConsultationDialogueStream,
  sendConsultationMessage,
  setAdminUserStatus,
  updateAdminUser,
  updateConsultationDraft,
  updateDisease,
  updateDoctorPatient,
} from './backendApi'
import {
  changeMyPassword,
  fetchCurrentUser,
  loginWithCredentials,
  registerDoctor,
  updateCurrentUser,
} from './authApi'
import { getAccessToken } from './http'
import { toConsultationSuggestion } from './backendMappers'
import type { ConsultationSuggestionDto } from './backendTypes'
import { isSuggestionMeaningful, readCachedSuggestion, writeCachedSuggestion } from '../lib/suggestionStorage'

export const useLogin = () =>
  useMutation({
    mutationFn: (args: { identifier: string; password: string }) =>
      loginWithCredentials(args.identifier, args.password),
  })

export const useCurrentUser = (scope?: 'doctor' | 'admin') => {
  const token = scope ? getAccessToken(scope) : getAccessToken()
  return useQuery({
    queryKey: ['auth', 'me', scope],
    queryFn: () => fetchCurrentUser(scope),
    enabled: Boolean(token),
  })
}

export const useUpdateCurrentUser = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (patch: Parameters<typeof updateCurrentUser>[0]) =>
      updateCurrentUser(patch),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
      await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })
}

export const useChangeMyPassword = () =>
  useMutation({
    mutationFn: (args: { oldPassword: string; newPassword: string }) =>
      changeMyPassword(args.oldPassword, args.newPassword),
  })

export const useRegisterDoctor = () =>
  useMutation({
    mutationFn: (args: Parameters<typeof registerDoctor>[0]) => registerDoctor(args),
  })

export const useDoctorCases = () =>
  useQuery({ queryKey: ['cases'], queryFn: fetchDoctorCases })

export const useDeleteConsultation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (args: { consultationId: string }) => deleteConsultation(args.consultationId),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['cases'] })
      await queryClient.invalidateQueries({ queryKey: ['case', variables.consultationId] })
      await queryClient.invalidateQueries({ queryKey: ['case', variables.consultationId, 'messages'] })
      await queryClient.invalidateQueries({ queryKey: ['case', variables.consultationId, 'suggestions'] })
      await queryClient.invalidateQueries({ queryKey: ['consultation', variables.consultationId, 'draft'] })
    },
  })
}

export const useCaseDetails = (caseId?: string) =>
  useQuery({
    queryKey: ['case', caseId],
    queryFn: () => fetchCaseDetails(caseId ?? ''),
    enabled: Boolean(caseId),
  })

export const useCaseMessages = (
  caseId?: string,
  options?: {
    enabled?: boolean
    refetchOnMount?: boolean | 'always'
  },
) =>
  useQuery({
    queryKey: ['case', caseId, 'messages'],
    queryFn: () => fetchCaseMessages(caseId ?? ''),
    enabled: options?.enabled ?? Boolean(caseId),
    refetchOnMount: options?.refetchOnMount,
  })

export const useCaseSuggestions = (
  caseId?: string,
  options?: {
    enabled?: boolean
    refetchOnMount?: boolean | 'always'
  },
) =>
  useQuery({
    queryKey: ['case', caseId, 'suggestions'],
    queryFn: async () => {
      const suggestion = await fetchSuggestions(caseId ?? '')
      if (isSuggestionMeaningful(suggestion)) {
        writeCachedSuggestion(caseId, suggestion)
        return suggestion
      }
      return readCachedSuggestion(caseId) ?? suggestion
    },
    initialData: () => readCachedSuggestion(caseId),
    enabled: options?.enabled ?? Boolean(caseId),
    refetchOnMount: options?.refetchOnMount,
  })

export const useAdminUsers = () =>
  useQuery({ queryKey: ['admin', 'users'], queryFn: fetchUsers })

export const useCreateAdminUser = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (args: Parameters<typeof createAdminUser>[0]) => createAdminUser(args),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })
}

export const useAdminStats = () =>
  useQuery({ queryKey: ['admin', 'stats'], queryFn: fetchAdminStats })

export const useAdminConsultations = () =>
  useQuery({ queryKey: ['admin', 'consultations'], queryFn: fetchAdminConsultations })

export const useAdminPatients = () =>
  useQuery({ queryKey: ['admin', 'patients'], queryFn: fetchAdminPatients })

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

export const useDiseases = () =>
  useQuery({ queryKey: ['admin', 'diseases'], queryFn: fetchDiseases })

export const useDiseasesPage = (params: Parameters<typeof fetchDiseasesPage>[0]) =>
  useQuery({ queryKey: ['admin', 'diseases', params], queryFn: () => fetchDiseasesPage(params) })

export const useCreateDisease = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (args: Parameters<typeof createDisease>[0]) => createDisease(args),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'diseases'], exact: false })
    },
  })
}

export const useDeleteDisease = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (args: { diseaseId: string }) => deleteDisease(args.diseaseId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'diseases'], exact: false })
    },
  })
}

export const useUpdateDisease = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (args: { diseaseId: string; patch: Parameters<typeof updateDisease>[1] }) =>
      updateDisease(args.diseaseId, args.patch),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'diseases'], exact: false })
    },
  })
}

export const useImportDiseases = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (args: { file: File }) => importDiseasesFromFile(args.file),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'diseases'], exact: false })
    },
  })
}

export const useDoctorPatients = () =>
  useQuery({ queryKey: ['doctor', 'patients'], queryFn: fetchDoctorPatients })

export const useDeleteDoctorPatient = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (args: { patientId: string }) => deleteDoctorPatient(args.patientId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['doctor', 'patients'] })
    },
  })
}

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
      await queryClient.invalidateQueries({ queryKey: ['admin', 'patients'] })
    },
  })
}

export const usePatientDetails = (patientId?: string) =>
  useQuery({
    queryKey: ['doctor', 'patients', patientId],
    queryFn: () => fetchPatientDetails(patientId ?? ''),
    enabled: Boolean(patientId),
  })

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
      await queryClient.invalidateQueries({ queryKey: ['cases'] })
      await queryClient.invalidateQueries({ queryKey: ['case', variables.consultationId] })
      await queryClient.invalidateQueries({
        queryKey: ['consultation', variables.consultationId, 'draft'],
      })
    },
  })
}

export const useSendConsultationMessage = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (args: {
      consultationId: string
      content: string
      onDelta?: (delta: string, payload?: unknown) => void
      onDone?: (payload?: unknown) => void
      onError?: (error: Error) => void
    }) =>
      sendConsultationMessage(args.consultationId, args.content, {
        onDelta: args.onDelta,
        onDone: (payload) => {
          args.onDone?.(payload)
          if (!payload || typeof payload !== 'object') return
          const raw = payload as ConsultationSuggestionDto
          if (
            !('candidate_diseases' in raw) &&
            !('assistant_message' in raw) &&
            !('confirmed_symptoms' in raw)
          ) {
            return
          }
          const candidateCount = Array.isArray(raw.candidate_diseases) ? raw.candidate_diseases.length : 0
          if (candidateCount === 0) return
          const suggestion = toConsultationSuggestion(raw)
          if (suggestion) {
            queryClient.setQueryData(['case', args.consultationId, 'suggestions'], suggestion)
            writeCachedSuggestion(args.consultationId, suggestion)
          }
        },
        onError: args.onError,
      }),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ['case', variables.consultationId, 'messages'],
      })
      await queryClient.invalidateQueries({
        queryKey: ['case', variables.consultationId, 'suggestions'],
      })
      await queryClient.invalidateQueries({
        queryKey: ['consultation', variables.consultationId, 'draft'],
      })
    },
  })
}

export const useConsultationDialogue = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (args: {
      consultationId: string
      message?: string | null
      mode?: 'guided' | 'model_decision'
      topK?: number
    }) => sendConsultationDialogue(args),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ['case', variables.consultationId, 'suggestions'],
      })
      await queryClient.invalidateQueries({
        queryKey: ['consultation', variables.consultationId, 'draft'],
      })
    },
  })
}

export const useConsultationDecisionStream = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (args: {
      consultationId: string
      message?: string | null
      topK?: number
      onDelta?: (delta: string, payload?: unknown) => void
      onDone?: (payload?: unknown) => void
      onError?: (error: Error) => void
    }) =>
      sendConsultationDialogueStream(
        {
          consultationId: args.consultationId,
          message: args.message,
          mode: 'model_decision',
          topK: args.topK,
        },
        {
          onDelta: args.onDelta,
          onDone: args.onDone,
          onError: args.onError,
        },
      ),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ['case', variables.consultationId, 'suggestions'],
      })
      await queryClient.invalidateQueries({
        queryKey: ['consultation', variables.consultationId, 'draft'],
      })
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
