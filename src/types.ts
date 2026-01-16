export type UserRole = 'admin' | 'doctor'
export type CaseStatus = 'open' | 'in_review' | 'closed'
export type MessageSender = 'doctor' | 'system' | 'model' | 'patientinfo'
export type SuggestionSource = 'knowledge-base' | 'model'

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
  gender: PatientDemographics['gender']
  age: number
  status: CaseStatus
  chiefComplaint: string
  symptomsText?: string
  diagnosisText?: string
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
}

export interface ConsultationSuggestion {
  confidence: number
  source: SuggestionSource
  diseases: string[]
  syndromes: string[]
  formulas: string[]
  followUps: string[]
  rationale: string
}

export interface UserSummary {
  id: string
  name: string
  username?: string
  realName?: string
  role: UserRole
  status: 'active' | 'suspended'
  org?: string
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

export interface AuditLogEntry {
  id: string
  actor: string
  action: string
  target: string
  createdAt: string
  severity: 'info' | 'warning'
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

export interface MedicalCaseSummary {
  id: string
  doctorName?: string
  patientId: string
  patientName: string
  diagnosis: string
  formulaName: string
  consultationId?: string
  updatedAt: string
  createdAt: string
}

export interface MedicalCaseDetails extends MedicalCaseSummary {
  symptoms: string
  formulaDetail: string
  usageNote: string
  note?: string
}

export interface Citation {
  fileId: string
  fileName: string
  page: number
  fileType?: 'pdf' | 'doc' | 'docx' | 'other'
  viewUrl?: string
}

export interface KnowledgeFile {
  id: string
  fileName: string
  fileType: 'pdf' | 'doc' | 'docx' | 'other'
  fileSize: number
  status: 'processing' | 'ready' | 'failed'
  createdAt: string
  updatedAt: string
  viewUrl?: string
}

export interface KnowledgeSearchHit {
  id: string
  fileId: string
  fileName: string
  fileType: KnowledgeFile['fileType']
  page: number
  snippet: string
  score?: number
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
