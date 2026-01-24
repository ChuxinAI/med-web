export type UserRole = 'admin' | 'doctor'
export type CaseStatus = 'open' | 'in_review' | 'closed'
export type MessageSender = 'doctor' | 'system' | 'model' | 'patientinfo'
export type SuggestionSource = 'knowledge-base' | 'model'

export interface ConsultationCandidateDisease {
  id: string
  name: string
  typeName?: string
  typeCode?: string
  probability: number
  score?: number
  matchedSymptoms?: string[]
}

export interface ConsultationCandidateSymptomDetail {
  id: string
  name: string
  symptoms: string[]
  matchedSymptoms: string[]
  unmatchedSymptoms: string[]
}

export interface ConsultationReasoningTree {
  candidateIds: string[]
  askSymptom: string | null
  yes?: ConsultationReasoningTree | null
  no?: ConsultationReasoningTree | null
}

export interface ConsultationDecision {
  diseaseName: string
  prescription: string
  confidence?: number | null
}

export interface ConsultationDialogue {
  reply: string
  confirmedSymptoms: string[]
  extractedSymptoms: string[]
  candidateDiseases: ConsultationCandidateDisease[]
  normalizedUserSymptoms?: string[]
  candidateSymptomDetails?: ConsultationCandidateSymptomDetail[]
  reasoningTree?: ConsultationReasoningTree | null
  followupQuestions: string[]
  decision?: ConsultationDecision | null
  fallbackByModel?: boolean
}

export interface PatientDemographics {
  name: string
  gender: '男' | '女'
  age: number
  occupation?: string
  vitals?: {
    bp?: string
    hr?: string
    temp?: string
  }
}

export interface CaseSummary {
  id: string
  patientName: string
  patientId?: string
  gender: PatientDemographics['gender']
  age: number
  status: CaseStatus
  chiefComplaint: string
  symptomsText?: string
  diagnosisText?: string
  formulaName?: string
  createdAt: string
  updatedAt: string
  doctorName: string
  tags?: string[]
  unreadMessages?: number
}

export interface CaseDetails extends CaseSummary {
  demographics: PatientDemographics
  symptoms: string[]
  notes: string
  disease?: string
  syndrome?: string
  formulas?: string[]
  followUps?: string[]
  auditTags?: string[]
}

export interface CaseMessage {
  id: string
  sender: MessageSender
  content: string
  createdAt: string
  source?: SuggestionSource
  citations?: Citation[]
  isStreaming?: boolean
}

export interface ConsultationSuggestion {
  confidence: number
  source: SuggestionSource
  diseases: string[]
  syndromes: string[]
  formulas: string[]
  followUps: string[]
  rationale: string
  candidateDiseases?: ConsultationCandidateDisease[]
  confirmedSymptoms?: string[]
  extractedSymptoms?: string[]
  normalizedUserSymptoms?: string[]
  candidateSymptomDetails?: ConsultationCandidateSymptomDetail[]
  reasoningTree?: ConsultationReasoningTree | null
  decision?: ConsultationDecision | null
  fallbackByModel?: boolean
}

export interface UserSummary {
  id: string
  name: string
  username?: string
  role: UserRole
  status: 'active' | 'suspended'
  org?: string
  province?: string
  city?: string
  county?: string
  region?: string
  phone?: string
  email?: string
  note?: string
  registeredAt?: string
  lastLoginAt?: string
  registerIp?: string
  lastLoginIp?: string
  createdAt: string
  lastActive: string
}

export interface CatalogEntry {
  id: string
  name: string
  category: 'disease' | 'syndrome' | 'symptom' | 'formula'
  description: string
  linkedTo?: string[]
}

export interface Disease {
  id: string
  name: string
  typeName: string
  typeCode: string
  symptoms: string
  differentiation: string
  formula: string
  note?: string
  createdAt: string
  updatedAt: string
}

export interface Patient {
  id: string
  name: string
  gender?: '男' | '女'
  age?: number
  birthday?: string
  region?: string
  phone?: string
  email?: string
  note?: string
  doctorName?: string
  createdAt: string
  updatedAt: string
}

export interface AdminStats {
  doctorConsultations: { doctorName: string; count: number }[]
  syndromeConsultations: { syndrome: string; count: number }[]
  formulaConsultations: { formula: string; count: number }[]
  doctorCityCounts: { city: string; count: number }[]
}


export interface Citation {
  diseaseId?: string
  diseaseName?: string
  fileId?: string
  fileName?: string
  page?: number
  fileType?: 'pdf' | 'doc' | 'docx' | 'other'
  viewUrl?: string
}


export type DraftFieldStatus = 'empty' | 'suggested' | 'confirmed' | 'edited'

export interface ConsultationDraft {
  consultationId: string
  patientId?: string
  symptoms: string
  diagnosis: string
  formulaName: string
  formulaDetail: string
  usageNote: string
  note: string
  status: Record<
    'patientId' | 'symptoms' | 'diagnosis' | 'formulaName' | 'formulaDetail' | 'usageNote' | 'note',
    DraftFieldStatus
  >
  updatedAt: string
}
