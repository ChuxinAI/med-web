export interface TokenResponseDto {
  access_token: string
  refresh_token: string
  token_type?: string
  expires_at: string
}

export interface PageMetaDto {
  page: number
  page_size: number
  total: number
}

export interface PaginatedResponseDto<T> {
  items: T[]
  meta: PageMetaDto
}

export interface CountItemDto {
  label: string
  count: number
}

export interface AdminStatsDto {
  doctor_consultations: CountItemDto[]
  syndrome_consultations?: CountItemDto[]
  disease_consultations?: CountItemDto[]
  formula_consultations: CountItemDto[]
  doctor_city_counts: CountItemDto[]
}

export interface UserSummaryDto {
  id: number
  role: string
  status: string
  username?: string | null
  name?: string | null
  org?: string | null
  province?: string | null
  city?: string | null
  county?: string | null
  phone?: string | null
  email?: string | null
  note?: string | null
  registered_at?: string | null
  last_login_at?: string | null
  register_ip?: string | null
  last_login_ip?: string | null
  created_at?: string | null
  last_active?: string | null
}


export interface ConsultationSummaryDto {
  id: string
  patient_id?: number | null
  patient_name?: string | null
  patient_age?: number | null
  doctor_name?: string | null
  status: 'open' | 'in_review' | 'closed'
  summary?: string | null
  symptoms?: string | null
  disease?: string | null
  formula?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface ConsultationDetailDto {
  id: string
  patient_id?: number | null
  patient_name?: string | null
  patient_age?: number | null
  doctor_name?: string | null
  status: 'open' | 'in_review' | 'closed'
  summary?: string | null
  created_at?: string | null
  updated_at?: string | null
  symptoms?: string | null
  disease?: string | null
  formula?: string | null
  note?: string | null
}

export interface ConsultationUpdateDto {
  patient_id?: number | null
  status?: 'open' | 'in_review' | 'closed' | null
  summary?: string | null
  symptoms?: string | null
  disease?: string | null
  formula?: string | null
  note?: string | null
}

export interface ConsultationMessageDto {
  id: number
  role: string
  content: string
  citations?: unknown[] | null
  created_at?: string | null
}

export interface ConsultationCandidateDiseaseDto {
  id: number
  name: string
  type_name?: string | null
  type_code?: string | null
  probability: number
  score: number
  matched_symptoms?: string[]
}

export interface ConsultationDecisionDto {
  disease_name: string
  prescription: string
  confidence?: number | null
}

export interface ConsultationDialogueDto {
  reply: string
  confirmed_symptoms?: string[]
  extracted_symptoms?: string[]
  candidate_diseases?: ConsultationCandidateDiseaseDto[]
  followup_questions?: string[]
  decision?: ConsultationDecisionDto | null
  fallback_by_model?: boolean
}

export interface ConsultationSuggestionDto {
  assistant_message?: ConsultationMessageDto | null
  citations: unknown[]
  extractions?: Record<string, unknown> | null
  extracted_symptoms?: string[]
  confirmed_symptoms?: string[]
  next_questions: string[]
  candidate_diseases: ConsultationCandidateDiseaseDto[]
  fallback_by_model?: boolean
}

export interface DiseaseDto {
  id: number
  name: string
  type_name?: string | null
  type_code?: string | null
  symptoms: string
  differentiation?: string | null
  formula: string
  note?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface PatientSummaryDto {
  id: number
  name: string
  gender?: string | null
  age?: number | null
  birthday?: string | null
  region?: string | null
  phone?: string | null
  email?: string | null
  note?: string | null
  doctor_name?: string | null
  created_at?: string | null
  updated_at?: string | null
}
