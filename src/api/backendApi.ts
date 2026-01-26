import type {
  AdminStats,
  CaseDetails,
  CaseMessage,
  CaseSummary,
  ConsultationDialogue,
  ConsultationDraft,
  ConsultationSuggestion,
  Disease,
  Patient,
  UserSummary,
} from '../types'
import { API_BASE_URL, apiRequest, buildApiError, getAccessToken } from './http'
import type {
  AdminStatsDto,
  ConsultationDialogueDto,
  ConsultationDetailDto,
  ConsultationMessageDto,
  ConsultationSuggestionDto,
  ConsultationSummaryDto,
  DiseaseDto,
  PageMetaDto,
  PaginatedResponseDto,
  PatientSummaryDto,
  UserSummaryDto,
} from './backendTypes'
import {
  buildDraft,
  toAdminStats,
  toCaseDetails,
  toConsultationMessage,
  toConsultationSummary,
  toConsultationDialogue,
  toConsultationSuggestion,
  toDisease,
  toPatient,
  toUserSummary,
} from './backendMappers'

export async function fetchUsers(): Promise<UserSummary[]> {
  const response = await apiRequest<PaginatedResponseDto<UserSummaryDto>>(
    '/admin/users?page=1&pageSize=200',
  )
  return response.items.map(toUserSummary)
}

export async function createAdminUser(input: {
  role: 'doctor' | 'admin'
  username: string
  password: string
  name?: string
  org?: string
  province?: string
  city?: string
  county?: string
  phone?: string
  email?: string
  note?: string
}): Promise<UserSummary> {
  const dto = await apiRequest<UserSummaryDto>('/admin/users', {
    method: 'POST',
    body: JSON.stringify({
      role: input.role,
      username: input.username,
      password: input.password,
      name: input.name,
      org: input.org,
      province: input.province,
      city: input.city,
      county: input.county,
      phone: input.phone,
      email: input.email,
      note: input.note,
    }),
  })
  return toUserSummary(dto)
}

export async function updateAdminUser(
  userId: string,
  patch: Partial<UserSummary>,
): Promise<UserSummary> {
  const dto = await apiRequest<UserSummaryDto>(`/admin/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      username: patch.username,
      name: patch.name,
      org: patch.org,
      province: patch.province,
      city: patch.city,
      county: patch.county,
      phone: patch.phone,
      email: patch.email,
      note: patch.note,
    }),
  })
  return toUserSummary(dto)
}

export async function setAdminUserStatus(
  userId: string,
  status: UserSummary['status'],
): Promise<UserSummary> {
  const endpoint = status === 'suspended' ? 'ban' : 'unban'
  const dto = await apiRequest<UserSummaryDto>(`/admin/users/${userId}/${endpoint}`, {
    method: 'POST',
  })
  return toUserSummary(dto)
}

export async function resetAdminUserPassword(userId: string) {
  const tempPassword = Math.random().toString(16).slice(2, 10)
  await apiRequest(`/admin/users/${userId}/reset-password`, {
    method: 'POST',
    body: JSON.stringify({ new_password: tempPassword }),
  })
  return { tempPassword }
}

export async function fetchAdminStats(): Promise<AdminStats> {
  const dto = await apiRequest<AdminStatsDto>('/admin/stats/overview')
  return toAdminStats(dto)
}

export async function fetchDoctorPatients(): Promise<Patient[]> {
  const response = await apiRequest<PaginatedResponseDto<PatientSummaryDto>>(
    '/doctor/patients?page=1&pageSize=200',
  )
  return response.items.map(toPatient)
}

export async function deleteDoctorPatient(patientId: string) {
  await apiRequest(`/doctor/patients/${patientId}`, { method: 'DELETE' })
}

export async function createDoctorPatient(
  input: Pick<Patient, 'name' | 'gender' | 'age' | 'birthday' | 'region' | 'phone' | 'email' | 'note'>,
): Promise<Patient> {
  const dto = await apiRequest<PatientSummaryDto>('/doctor/patients', {
    method: 'POST',
    body: JSON.stringify({
      name: input.name,
      gender: input.gender,
      age: input.age,
      birthday: input.birthday,
      region: input.region,
      phone: input.phone,
      email: input.email,
      note: input.note,
    }),
  })
  return toPatient(dto)
}

export async function updateDoctorPatient(
  patientId: string,
  patch: Partial<Pick<Patient, 'name' | 'gender' | 'age' | 'birthday' | 'region' | 'phone' | 'email' | 'note'>>,
): Promise<Patient> {
  const dto = await apiRequest<PatientSummaryDto>(`/doctor/patients/${patientId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      name: patch.name,
      gender: patch.gender,
      age: patch.age,
      birthday: patch.birthday,
      region: patch.region,
      phone: patch.phone,
      email: patch.email,
      note: patch.note,
    }),
  })
  return toPatient(dto)
}

export async function fetchPatientDetails(patientId: string): Promise<Patient> {
  const dto = await apiRequest<PatientSummaryDto>(`/doctor/patients/${patientId}`)
  return toPatient(dto)
}

export async function fetchDoctorCases(): Promise<CaseSummary[]> {
  const response = await apiRequest<PaginatedResponseDto<ConsultationSummaryDto>>(
    '/doctor/consultations?page=1&pageSize=200',
  )
  return response.items.map(toConsultationSummary)
}

export async function deleteConsultation(consultationId: string) {
  await apiRequest(`/doctor/consultations/${consultationId}`, { method: 'DELETE' })
}

export async function createConsultation(args?: { patientId?: string }) {
  const dto = await apiRequest<ConsultationSummaryDto>('/doctor/consultations', {
    method: 'POST',
    body: JSON.stringify({
      patient_id: args?.patientId ? Number(args.patientId) : null,
    }),
  })
  return { consultationId: String(dto.id) }
}

export async function fetchCaseDetails(caseId: string): Promise<CaseDetails> {
  const dto = await apiRequest<ConsultationDetailDto>(`/doctor/consultations/${caseId}`)
  return toCaseDetails(dto)
}

export async function fetchCaseMessages(caseId: string): Promise<CaseMessage[]> {
  const dto = await apiRequest<ConsultationMessageDto[]>(
    `/doctor/consultations/${caseId}/messages`,
  )
  return dto.map(toConsultationMessage)
}

export async function fetchSuggestions(caseId: string): Promise<ConsultationSuggestion | undefined> {
  const dto = await apiRequest<ConsultationSuggestionDto>(
    `/doctor/consultations/${caseId}/suggestions`,
  )
  return toConsultationSuggestion(dto)
}

export async function fetchConsultationDraft(consultationId: string): Promise<ConsultationDraft> {
  const dto = await apiRequest<ConsultationDetailDto>(`/doctor/consultations/${consultationId}`)
  return buildDraft(consultationId, dto)
}

export async function updateConsultationDraft(
  consultationId: string,
  patch: Partial<ConsultationDraft>,
): Promise<ConsultationDraft> {
  const payload: Record<string, unknown> = {}
  if ('patientId' in patch) {
    payload.patient_id = patch.patientId ? Number(patch.patientId) : null
  }
  if ('symptoms' in patch) {
    payload.symptoms = patch.symptoms?.trim() ? patch.symptoms : null
  }
  if ('diagnosis' in patch) {
    payload.disease = patch.diagnosis?.trim() ? patch.diagnosis : null
  }
  if ('formulaName' in patch) {
    payload.formula = patch.formulaName?.trim() ? patch.formulaName : null
  }
  if ('note' in patch) {
    payload.note = patch.note?.trim() ? patch.note : null
  }
  const dto = await apiRequest<ConsultationDetailDto>(`/doctor/consultations/${consultationId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  return buildDraft(consultationId, dto)
}

export async function sendConsultationDialogue(args: {
  consultationId: string
  message?: string | null
  mode?: 'guided' | 'model_decision'
  topK?: number
}): Promise<ConsultationDialogue> {
  const dto = await apiRequest<ConsultationDialogueDto>(
    `/doctor/consultations/${args.consultationId}/dialogue`,
    {
      method: 'POST',
      body: JSON.stringify({
        message: args.message ?? null,
        mode: args.mode ?? 'guided',
        top_k: args.topK ?? 10,
      }),
    },
  )
  return toConsultationDialogue(dto)
}

type StreamHandlers = {
  onDelta?: (delta: string, payload?: unknown) => void
  onDone?: (payload?: unknown) => void
  onError?: (error: Error) => void
}

function extractStreamDelta(payload: unknown) {
  if (!payload) return ''
  if (typeof payload === 'string') return payload
  if (typeof payload === 'object') {
    const data = payload as {
      delta?: string
      content?: string
      text?: string
      message?: { content?: string }
    }
    return data.delta ?? data.content ?? data.text ?? data.message?.content ?? ''
  }
  return ''
}

async function readSseResponse(response: Response, handlers?: StreamHandlers) {
  if (!response.body) {
    handlers?.onDone?.()
    return null
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  let doneEmitted = false
  let donePayload: unknown = null
  const handleEvent = (raw: string) => {
    if (!raw.trim()) return
    let event = ''
    const dataLines: string[] = []
    raw.split(/\r?\n/).forEach((line) => {
      if (line.startsWith('event:')) {
        event = line.slice(6).trim()
      } else if (line.startsWith('data:')) {
        dataLines.push(line.slice(5).trim())
      }
    })
    if (dataLines.length === 0) return
    const data = dataLines.join('\n')
    let payload: unknown = data
    if (data.startsWith('{') || data.startsWith('[')) {
      try {
        payload = JSON.parse(data)
      } catch {
        payload = data
      }
    }

    const normalizedEvent =
      event || (typeof payload === 'object' && payload ? (payload as { event?: string }).event : '')
    if (normalizedEvent === 'done') {
      if (!doneEmitted) {
        donePayload = payload
        handlers?.onDone?.(payload)
        doneEmitted = true
      }
      return
    }
    if (normalizedEvent === 'error') {
      const message = extractStreamDelta(payload) || '请求失败，请稍后重试'
      handlers?.onError?.(new Error(message))
      return
    }
    const delta = extractStreamDelta(payload)
    if (delta) {
      handlers?.onDelta?.(delta, payload)
    }
  }

  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      let separatorIndex = buffer.indexOf('\n\n')
      while (separatorIndex !== -1) {
        const raw = buffer.slice(0, separatorIndex)
        buffer = buffer.slice(separatorIndex + 2)
        handleEvent(raw)
        separatorIndex = buffer.indexOf('\n\n')
      }
    }
    if (buffer.trim()) {
      handleEvent(buffer)
    }
    if (!doneEmitted) {
      handlers?.onDone?.()
      doneEmitted = true
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error('请求失败，请稍后重试')
    handlers?.onError?.(err)
    throw err
  }

  return donePayload
}

export async function sendConsultationMessage(
  consultationId: string,
  content: string,
  handlers?: StreamHandlers,
) {
  const token = getAccessToken()
  const response = await fetch(`${API_BASE_URL}/doctor/consultations/${consultationId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ content }),
  })

  if (!response.ok) {
    let payload: unknown = null
    try {
      payload = await response.json()
    } catch {
      payload = null
    }
    const error = buildApiError(payload, response.status)
    handlers?.onError?.(error)
    throw error
  }

  await readSseResponse(response, handlers)
}

export async function sendConsultationDialogueStream(
  args: {
    consultationId: string
    message?: string | null
    mode?: 'guided' | 'model_decision'
    topK?: number
  },
  handlers?: StreamHandlers,
): Promise<ConsultationDialogue> {
  const token = getAccessToken()
  const response = await fetch(
    `${API_BASE_URL}/doctor/consultations/${args.consultationId}/dialogue/stream`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        message: args.message ?? null,
        mode: args.mode ?? 'model_decision',
        top_k: args.topK ?? 10,
      }),
    },
  )

  if (!response.ok) {
    let payload: unknown = null
    try {
      payload = await response.json()
    } catch {
      payload = null
    }
    const error = buildApiError(payload, response.status)
    handlers?.onError?.(error)
    throw error
  }

  const payload = await readSseResponse(response, handlers)
  const dto =
    payload && typeof payload === 'object'
      ? (payload as ConsultationDialogueDto)
      : ({ reply: '' } as ConsultationDialogueDto)
  return toConsultationDialogue(dto)
}

export async function fetchDiseases(): Promise<Disease[]> {
  const response = await apiRequest<PaginatedResponseDto<DiseaseDto>>(
    '/admin/diseases?page=1&pageSize=200',
  )
  return response.items.map(toDisease)
}

export async function fetchDiseasesPage(input: {
  page: number
  pageSize: number
  q?: string
  type?: string
}): Promise<{ items: Disease[]; meta: PageMetaDto }> {
  const params = new URLSearchParams()
  params.set('page', String(input.page))
  params.set('pageSize', String(input.pageSize))
  const keyword = input.q?.trim()
  if (keyword) params.set('q', keyword)
  if (input.type) params.set('type', input.type)
  const response = await apiRequest<PaginatedResponseDto<DiseaseDto>>(`/admin/diseases?${params.toString()}`)
  return {
    items: response.items.map(toDisease),
    meta: response.meta,
  }
}

export async function createDisease(
  input: Pick<
    Disease,
    'name' | 'typeName' | 'typeCode' | 'symptoms' | 'differentiation' | 'formula' | 'note'
  >,
) {
  const dto = await apiRequest<DiseaseDto>('/admin/diseases', {
    method: 'POST',
    body: JSON.stringify({
      name: input.name,
      type_name: input.typeName,
      type_code: input.typeCode,
      symptoms: input.symptoms,
      differentiation: input.differentiation,
      formula: input.formula,
      note: input.note,
    }),
  })
  return toDisease(dto)
}

export async function updateDisease(
  diseaseId: string,
  patch: Partial<
    Pick<
      Disease,
      'name' | 'typeName' | 'typeCode' | 'symptoms' | 'differentiation' | 'formula' | 'note'
    >
  >,
) {
  const dto = await apiRequest<DiseaseDto>(`/admin/diseases/${diseaseId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      name: patch.name,
      type_name: patch.typeName,
      type_code: patch.typeCode,
      symptoms: patch.symptoms,
      differentiation: patch.differentiation,
      formula: patch.formula,
      note: patch.note,
    }),
  })
  return toDisease(dto)
}

export async function deleteDisease(diseaseId: string) {
  await apiRequest(`/admin/diseases/${diseaseId}`, { method: 'DELETE' })
}

export async function importDiseasesFromFile(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  const dto = await apiRequest<{ inserted: number; skipped: number; skipped_rows: Record<string, unknown>[] }>(
    '/admin/diseases/import',
    {
      method: 'POST',
      body: formData,
    },
  )
  return { imported: dto.inserted, skipped: dto.skipped, skippedRows: dto.skipped_rows ?? [] }
}

export async function fetchCatalog(): Promise<Disease[]> {
  const dto = await apiRequest<DiseaseDto[]>('/catalog')
  return dto.map(toDisease)
}

export async function fetchAdminConsultations() {
  const response = await apiRequest<PaginatedResponseDto<ConsultationSummaryDto>>(
    '/admin/stats/consultations?page=1&pageSize=200',
  )
  return response.items.map(toConsultationSummary)
}

export async function fetchAdminPatients() {
  const response = await apiRequest<PaginatedResponseDto<PatientSummaryDto>>(
    '/admin/stats/patients?page=1&pageSize=200',
  )
  return response.items.map(toPatient)
}
