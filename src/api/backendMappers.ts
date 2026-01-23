import type {
  AdminStats,
  CaseDetails,
  CaseMessage,
  CaseSummary,
  ConsultationCandidateDisease,
  ConsultationDecision,
  ConsultationDialogue,
  ConsultationDraft,
  ConsultationSuggestion,
  Citation,
  Disease,
  Patient,
  UserRole,
  UserSummary,
} from '../types'
import type {
  AdminStatsDto,
  ConsultationCandidateDiseaseDto,
  ConsultationDecisionDto,
  ConsultationDialogueDto,
  ConsultationDetailDto,
  ConsultationMessageDto,
  ConsultationSuggestionDto,
  ConsultationSummaryDto,
  DiseaseDto,
  PatientSummaryDto,
  UserSummaryDto,
} from './backendTypes'

const FALLBACK_TIME = new Date(0).toISOString()

function normalizeIso(value?: string | null) {
  return value ?? FALLBACK_TIME
}

export function toUserSummary(dto: UserSummaryDto): UserSummary {
  const createdAt = normalizeIso(dto.created_at ?? dto.registered_at)
  return {
    id: String(dto.id),
    role: dto.role as UserRole,
    status: dto.status as UserSummary['status'],
    username: dto.username ?? undefined,
    name: dto.name ?? '',
    org: dto.org ?? undefined,
    province: dto.province ?? undefined,
    city: dto.city ?? undefined,
    county: dto.county ?? undefined,
    region: [dto.province, dto.city, dto.county].filter(Boolean).join('/') || undefined,
    phone: dto.phone ?? undefined,
    email: dto.email ?? undefined,
    note: dto.note ?? undefined,
    registeredAt: dto.registered_at ?? undefined,
    lastLoginAt: dto.last_login_at ?? undefined,
    registerIp: dto.register_ip ?? undefined,
    lastLoginIp: dto.last_login_ip ?? undefined,
    createdAt,
    lastActive: normalizeIso(dto.last_active ?? dto.last_login_at ?? createdAt),
  }
}

export function toPatient(dto: PatientSummaryDto): Patient {
  return {
    id: String(dto.id),
    name: dto.name,
    gender: dto.gender === '男' || dto.gender === '女' ? dto.gender : undefined,
    age: dto.age ?? undefined,
    birthday: dto.birthday ?? undefined,
    region: dto.region ?? undefined,
    phone: dto.phone ?? undefined,
    email: dto.email ?? undefined,
    note: dto.note ?? undefined,
    doctorName: dto.doctor_name ?? undefined,
    createdAt: normalizeIso(dto.created_at),
    updatedAt: normalizeIso(dto.updated_at),
  }
}

export function toConsultationSummary(dto: ConsultationSummaryDto | ConsultationDetailDto): CaseSummary {
  const patientId = dto.patient_id != null ? String(dto.patient_id) : undefined
  const patientName = dto.patient_name ?? (patientId ? `患者#${patientId}` : '未关联患者')
  const doctorName = dto.doctor_name ?? '—'
  const patientAge = dto.patient_age ?? 0
  const fallbackSymptoms =
    (dto as { symptoms_text?: string | null }).symptoms_text ??
    (dto as { symptom?: string | null }).symptom ??
    ''
  const rawSymptoms = (() => {
    const direct = dto.symptoms
    if (Array.isArray(direct)) {
      return direct.length > 0 ? direct : fallbackSymptoms
    }
    if (typeof direct === 'string') {
      const trimmed = direct.trim()
      return trimmed ? trimmed : fallbackSymptoms
    }
    return fallbackSymptoms
  })()
  const symptomsText = Array.isArray(rawSymptoms)
    ? rawSymptoms.filter(Boolean).join('、')
    : typeof rawSymptoms === 'string'
      ? rawSymptoms.trim()
      : ''
  return {
    id: String(dto.id),
    patientName,
    patientId,
    gender: '男',
    age: patientAge,
    status: dto.status,
    chiefComplaint: dto.summary ?? '（未填写）',
    symptomsText: symptomsText ?? '',
    diagnosisText: dto.disease ?? '',
    formulaName: dto.formula ?? '',
    createdAt: normalizeIso(dto.created_at),
    updatedAt: normalizeIso(dto.updated_at ?? dto.created_at),
    doctorName,
    tags: dto.summary ? [dto.summary] : [],
    unreadMessages: 0,
  }
}

export function toCaseDetails(dto: ConsultationSummaryDto | ConsultationDetailDto): CaseDetails {
  const summary = toConsultationSummary(dto)
  return {
    ...summary,
    demographics: {
      name: summary.patientName,
      gender: summary.gender,
      age: summary.age,
    },
    symptoms: [],
    notes: '',
    auditTags: [],
  }
}

export function toConsultationMessage(dto: ConsultationMessageDto): CaseMessage {
  const sender =
    dto.role === 'doctor' || dto.role === 'user'
      ? 'doctor'
      : dto.role === 'assistant'
        ? 'model'
        : dto.role === 'patientinfo'
          ? 'patientinfo'
          : 'system'
  return {
    id: String(dto.id),
    sender,
    content: dto.content ?? '',
    createdAt: normalizeIso(dto.created_at),
    citations: Array.isArray(dto.citations)
      ? dto.citations
          .map((item) => toCitation(item))
          .filter((item) => item != null)
      : undefined,
  }
}

function toCitation(input: unknown): Citation | null {
  if (!input || typeof input !== 'object') return null
  const raw = input as {
    disease_id?: string | number
    disease_name?: string
    file_id?: string | number
    file_name?: string
    page?: number
    file_type?: string
    view_url?: string
  }
  return {
    diseaseId: raw.disease_id ? String(raw.disease_id) : undefined,
    diseaseName: raw.disease_name,
    fileId: raw.file_id ? String(raw.file_id) : undefined,
    fileName: raw.file_name,
    page: raw.page,
    fileType: raw.file_type as Citation['fileType'],
    viewUrl: raw.view_url,
  }
}

export function toConsultationSuggestion(dto?: ConsultationSuggestionDto): ConsultationSuggestion | undefined {
  if (!dto) return undefined
  const candidates = Array.isArray(dto.candidate_diseases)
    ? dto.candidate_diseases.map(toConsultationCandidateDisease)
    : []
  const diseases = candidates.map((item) => item.name).filter(Boolean)
  return {
    confidence: dto.fallback_by_model ? 0.3 : 0.7,
    source: dto.fallback_by_model ? 'model' : 'knowledge-base',
    diseases,
    syndromes: [],
    formulas: [],
    followUps: dto.next_questions ?? [],
    rationale: '',
    candidateDiseases: candidates,
    confirmedSymptoms: dto.confirmed_symptoms ?? [],
    extractedSymptoms: dto.extracted_symptoms ?? [],
    fallbackByModel: dto.fallback_by_model ?? false,
  }
}

function toConsultationCandidateDisease(dto: ConsultationCandidateDiseaseDto): ConsultationCandidateDisease {
  return {
    id: String(dto.id),
    name: dto.name,
    typeName: dto.type_name ?? undefined,
    typeCode: dto.type_code ?? undefined,
    probability: dto.probability ?? 0,
    score: dto.score ?? undefined,
    matchedSymptoms: dto.matched_symptoms ?? [],
  }
}

function toConsultationDecision(dto?: ConsultationDecisionDto | null): ConsultationDecision | null {
  if (!dto) return null
  return {
    diseaseName: dto.disease_name,
    prescription: dto.prescription,
    confidence: dto.confidence ?? null,
  }
}

export function toConsultationDialogue(dto: ConsultationDialogueDto): ConsultationDialogue {
  return {
    reply: dto.reply,
    confirmedSymptoms: dto.confirmed_symptoms ?? [],
    extractedSymptoms: dto.extracted_symptoms ?? [],
    candidateDiseases: (dto.candidate_diseases ?? []).map(toConsultationCandidateDisease),
    followupQuestions: dto.followup_questions ?? [],
    decision: toConsultationDecision(dto.decision),
    fallbackByModel: dto.fallback_by_model ?? false,
  }
}

export function buildDraft(consultationId: string, dto?: ConsultationDetailDto): ConsultationDraft {
  const now = new Date().toISOString()
  const symptoms = dto?.symptoms ?? ''
  const diagnosis = dto?.disease ?? ''
  const formulaName = dto?.formula ?? ''
  const note = dto?.note ?? ''
  return {
    consultationId,
    patientId: dto?.patient_id != null ? String(dto.patient_id) : undefined,
    symptoms,
    diagnosis,
    formulaName,
    formulaDetail: '',
    usageNote: '',
    note,
    status: {
      patientId: dto?.patient_id ? 'confirmed' : 'empty',
      symptoms: symptoms ? 'edited' : 'empty',
      diagnosis: diagnosis ? 'edited' : 'empty',
      formulaName: formulaName ? 'edited' : 'empty',
      formulaDetail: 'empty',
      usageNote: 'empty',
      note: note ? 'edited' : 'empty',
    },
    updatedAt: dto?.updated_at ?? now,
  }
}

export function toDisease(dto: DiseaseDto): Disease {
  return {
    id: String(dto.id),
    name: dto.name,
    typeName: dto.type_name ?? '',
    typeCode: dto.type_code ?? '',
    symptoms: dto.symptoms,
    differentiation: dto.differentiation ?? '',
    formula: dto.formula,
    note: dto.note ?? undefined,
    createdAt: normalizeIso(dto.created_at),
    updatedAt: normalizeIso(dto.updated_at ?? dto.created_at),
  }
}

export function toAdminStats(dto: AdminStatsDto): AdminStats {
  const diseaseSource = dto.disease_consultations ?? dto.syndrome_consultations ?? []
  return {
    doctorConsultations: dto.doctor_consultations.map((item) => ({
      doctorName: item.label,
      count: item.count,
    })),
    syndromeConsultations: diseaseSource.map((item) => ({
      syndrome: item.label,
      count: item.count,
    })),
    formulaConsultations: dto.formula_consultations.map((item) => ({
      formula: item.label,
      count: item.count,
    })),
    doctorCityCounts: dto.doctor_city_counts.map((item) => ({
      city: item.label,
      count: item.count,
    })),
  }
}
