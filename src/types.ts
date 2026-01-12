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
  role: UserRole
  status: 'active' | 'suspended'
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
