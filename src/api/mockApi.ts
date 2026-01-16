import type {
  AuditLogEntry,
  CaseDetails,
  CaseMessage,
  CaseSummary,
  CatalogEntry,
  ConsultationSuggestion,
  ConsultationDraft,
  KnowledgeFile,
  KnowledgeSearchHit,
  MedicalCaseDetails,
  MedicalCaseSummary,
  Patient,
  UserRole,
  UserSummary,
} from '../types'
import {
  mockAuditLogs,
  mockCaseDetails,
  mockCases,
  mockCatalog,
  mockKnowledgeFiles,
  mockKnowledgeHits,
  mockMedicalCaseDetails,
  mockMedicalCases,
  mockMessages,
  mockPatients,
  mockSuggestions,
  mockUsers,
} from './mockData'

const wait = (ms = 220) => new Promise((resolve) => setTimeout(resolve, ms))

const consultationDrafts: Record<string, ConsultationDraft> = {}

function getEmptyDraft(consultationId: string): ConsultationDraft {
  const now = new Date().toISOString()
  return {
    consultationId,
    patientId: undefined,
    symptoms: '',
    diagnosis: '',
    formulaName: '',
    formulaDetail: '',
    usageNote: '',
    note: '',
    status: {
      patientId: 'empty',
      symptoms: 'empty',
      diagnosis: 'empty',
      formulaName: 'empty',
      formulaDetail: 'empty',
      usageNote: 'empty',
      note: 'empty',
    },
    updatedAt: now,
  }
}

function getOrCreateDraft(consultationId: string) {
  if (!consultationDrafts[consultationId]) {
    consultationDrafts[consultationId] = getEmptyDraft(consultationId)
  }
  return consultationDrafts[consultationId]
}

export async function login(
  username: string,
  password: string,
): Promise<{ token: string; role: UserRole }> {
  await wait()
  void password
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

export async function createConsultation(args?: {
  patientId?: string
}): Promise<{ consultationId: string }> {
  await wait()

  const patient = args?.patientId ? mockPatients.find((p) => p.id === args.patientId) : undefined
  const now = new Date().toISOString()
  const id = 'CASE-' + Date.now().toString().slice(-5)

  mockCases.unshift({
    id,
    patientName: patient?.name ?? '未关联患者',
    gender: patient?.gender ?? '男',
    age: patient?.age ?? 0,
    status: 'open',
    chiefComplaint: '（待补充主诉）',
    symptomsText: '',
    diagnosisText: '',
    createdAt: now,
    updatedAt: now,
    doctorName: '李医生',
    tags: ['待补充'],
    unreadMessages: 0,
  })

  mockCaseDetails[id] = {
    ...mockCases[0],
    demographics: {
      name: patient?.name ?? '未关联患者',
      gender: patient?.gender ?? '男',
      age: patient?.age ?? 0,
    },
    symptoms: [],
    notes: '',
    auditTags: [],
  }

  mockMessages[id] = [
    {
      id: 'm-' + Math.random().toString(16).slice(2),
      sender: 'system',
      content:
        '你好，我是问诊助手。请先补充患者信息与主要症状，我会基于知识库内容提供可追溯的建议。',
      createdAt: now,
    },
  ]

  consultationDrafts[id] = {
    ...getEmptyDraft(id),
    patientId: patient?.id,
    status: {
      ...getEmptyDraft(id).status,
      patientId: patient?.id ? 'confirmed' : 'empty',
    },
  }

  return { consultationId: id }
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

export async function updateAdminUser(
  userId: string,
  patch: Partial<
    Pick<
      UserSummary,
      'org' | 'realName' | 'region' | 'phone' | 'email' | 'note'
    >
  >,
): Promise<UserSummary> {
  await wait()
  const index = mockUsers.findIndex((u) => u.id === userId)
  if (index < 0) throw new Error('未找到用户')
  const next: UserSummary = {
    ...mockUsers[index],
    ...patch,
    lastActive: new Date().toISOString(),
  }
  mockUsers[index] = next
  return next
}

export async function setAdminUserStatus(
  userId: string,
  status: UserSummary['status'],
  currentUserId = 'u1',
): Promise<UserSummary> {
  await wait()
  if (userId === currentUserId) throw new Error('不允许封禁当前登录用户')

  const index = mockUsers.findIndex((u) => u.id === userId)
  if (index < 0) throw new Error('未找到用户')

  if (status === 'suspended') {
    const activeAdmins = mockUsers.filter((u) => u.role === 'admin' && u.status === 'active')
    if (mockUsers[index].role === 'admin' && activeAdmins.length <= 1) {
      throw new Error('不允许封禁最后一个启用的管理员')
    }
  }

  const next: UserSummary = {
    ...mockUsers[index],
    status,
    lastActive: new Date().toISOString(),
  }
  mockUsers[index] = next
  return next
}

export async function resetAdminUserPassword(userId: string): Promise<{ tempPassword: string }> {
  await wait()
  const matched = mockUsers.find((u) => u.id === userId)
  if (!matched) throw new Error('未找到用户')
  return { tempPassword: Math.random().toString(16).slice(2, 10) }
}

export async function fetchCatalog(): Promise<CatalogEntry[]> {
  await wait()
  return mockCatalog
}

export async function fetchAuditLogs(): Promise<AuditLogEntry[]> {
  await wait()
  return mockAuditLogs
}

export async function fetchKnowledgeFiles(): Promise<KnowledgeFile[]> {
  await wait()
  return mockKnowledgeFiles
}

export async function deleteKnowledgeFile(fileId: string): Promise<void> {
  await wait()
  const index = mockKnowledgeFiles.findIndex((f) => f.id === fileId)
  if (index < 0) throw new Error('未找到文件')
  mockKnowledgeFiles.splice(index, 1)
}

export async function uploadKnowledgeFiles(files: { name: string; size: number }[]): Promise<void> {
  await wait()
  const now = new Date().toISOString()
  files.forEach((f) => {
    const id = 'kf-' + Math.random().toString(16).slice(2, 6)
    const ext = f.name.split('.').pop()?.toLowerCase()
    const fileType: KnowledgeFile['fileType'] =
      ext === 'pdf' ? 'pdf' : ext === 'doc' ? 'doc' : ext === 'docx' ? 'docx' : 'other'
    mockKnowledgeFiles.unshift({
      id,
      fileName: f.name,
      fileType,
      fileSize: f.size,
      status: 'processing',
      createdAt: now,
      updatedAt: now,
      viewUrl: 'https://example.com/knowledge/' + encodeURIComponent(f.name),
    })
  })
}

export async function searchKnowledge(query: string): Promise<KnowledgeSearchHit[]> {
  await wait()
  const keyword = query.trim()
  if (!keyword) return []
  return mockKnowledgeHits.filter((h) => (h.snippet + ' ' + h.fileName).includes(keyword))
}

export async function fetchConsultationDraft(
  consultationId: string,
): Promise<ConsultationDraft> {
  await wait()
  return getOrCreateDraft(consultationId)
}

export async function updateConsultationDraft(
  consultationId: string,
  patch: Partial<
    Pick<
      ConsultationDraft,
      'patientId' | 'symptoms' | 'diagnosis' | 'formulaName' | 'formulaDetail' | 'usageNote' | 'note'
    >
  > & {
    status?: Partial<ConsultationDraft['status']>
  },
): Promise<ConsultationDraft> {
  await wait()
  const existing = getOrCreateDraft(consultationId)
  const next: ConsultationDraft = {
    ...existing,
    ...patch,
    status: { ...existing.status, ...(patch.status ?? {}) },
    updatedAt: new Date().toISOString(),
  }
  consultationDrafts[consultationId] = next

  const caseIndex = mockCases.findIndex((c) => c.id === consultationId)
  if (caseIndex >= 0) {
    const nextPatientName =
      patch.patientId && mockPatients.find((p) => p.id === patch.patientId)?.name
        ? (mockPatients.find((p) => p.id === patch.patientId)?.name as string)
        : mockCases[caseIndex].patientName
    mockCases[caseIndex] = {
      ...mockCases[caseIndex],
      patientName: nextPatientName,
      symptomsText:
        typeof patch.symptoms === 'string' ? patch.symptoms : mockCases[caseIndex].symptomsText,
      diagnosisText:
        typeof patch.diagnosis === 'string' ? patch.diagnosis : mockCases[caseIndex].diagnosisText,
      updatedAt: next.updatedAt,
    }
  }
  return next
}

export async function sendConsultationMessage(
  consultationId: string,
  content: string,
): Promise<{ doctorMessage: CaseMessage; assistantMessage: CaseMessage }> {
  await wait()

  const doctorMessage: CaseMessage = {
    id: 'm-' + Math.random().toString(16).slice(2),
    sender: 'doctor',
    content,
    createdAt: new Date().toISOString(),
  }

  mockMessages[consultationId] = [...(mockMessages[consultationId] ?? []), doctorMessage]

  const draft = getOrCreateDraft(consultationId)
  const missing = (Object.entries(draft.status) as Array<
    [keyof ConsultationDraft['status'], ConsultationDraft['status'][keyof ConsultationDraft['status']]]
  >)
    .filter(([key, status]) => key !== 'patientId' && key !== 'note' && status === 'empty')
    .map(([key]) => key)

  const assistantMessage: CaseMessage = {
    id: 'm-' + Math.random().toString(16).slice(2),
    sender: 'system',
    content:
      missing.length > 0
        ? `已记录。本次建议优先补齐：${missing
            .slice(0, 3)
            .map((k) => {
              if (k === 'symptoms') return '症状'
              if (k === 'diagnosis') return '诊断结果'
              if (k === 'formulaName') return '方剂名'
              if (k === 'formulaDetail') return '方剂详情'
              if (k === 'usageNote') return '用法用量/备注'
              return k
            })
            .join('、')}。`
        : '已记录。本次信息已较完整，可进行保存或写入病例。',
    createdAt: new Date().toISOString(),
  }

  mockMessages[consultationId] = [...mockMessages[consultationId], assistantMessage]

  const caseIndex = mockCases.findIndex((c) => c.id === consultationId)
  if (caseIndex >= 0) {
    mockCases[caseIndex] = { ...mockCases[caseIndex], updatedAt: assistantMessage.createdAt }
  }

  return { doctorMessage, assistantMessage }
}

export async function createMedicalCaseFromConsultation(
  consultationId: string,
): Promise<MedicalCaseDetails> {
  await wait()
  const draft = getOrCreateDraft(consultationId)
  if (!draft.patientId) {
    throw new Error('写入病例前必须先创建并关联患者')
  }

  const newId = 'MC-' + Date.now().toString().slice(-6)
  const now = new Date().toISOString()
  const patient = mockPatients.find((p) => p.id === draft.patientId)

  const summary: MedicalCaseSummary = {
    id: newId,
    patientId: draft.patientId,
    patientName: patient?.name ?? '未命名患者',
    diagnosis: draft.diagnosis || '（未填写）',
    formulaName: draft.formulaName || '（未填写）',
    createdAt: now,
    updatedAt: now,
  }

  const detail: MedicalCaseDetails = {
    ...summary,
    symptoms: draft.symptoms,
    formulaDetail: draft.formulaDetail,
    usageNote: draft.usageNote,
    note: draft.note,
  }

  mockMedicalCases.unshift(summary)
  mockMedicalCaseDetails[newId] = detail

  return detail
}

export async function fetchDoctorPatients(): Promise<Patient[]> {
  await wait()
  return mockPatients
}

export async function createDoctorPatient(
  input: Pick<
    Patient,
    'name' | 'gender' | 'age' | 'birthday' | 'region' | 'phone' | 'email' | 'note'
  >,
): Promise<Patient> {
  await wait()
  if (!input.name.trim()) throw new Error('患者姓名不能为空')

  const id = 'P-' + (Math.floor(Math.random() * 900) + 100).toString()
  const now = new Date().toISOString()

  const patient: Patient = {
    id,
    name: input.name.trim(),
    gender: input.gender,
    age: input.age,
    birthday: input.birthday,
    region: input.region,
    phone: input.phone,
    email: input.email,
    note: input.note,
    doctorName: '李医生',
    createdAt: now,
    updatedAt: now,
  }

  mockPatients.unshift(patient)
  return patient
}

export async function updateDoctorPatient(
  patientId: string,
  patch: Partial<Pick<Patient, 'name' | 'gender' | 'age' | 'birthday' | 'region' | 'phone' | 'email' | 'note'>>,
): Promise<Patient> {
  await wait()
  const index = mockPatients.findIndex((p) => p.id === patientId)
  if (index < 0) throw new Error('未找到患者')
  const next: Patient = {
    ...mockPatients[index],
    ...patch,
    name: patch.name ? patch.name.trim() : mockPatients[index].name,
    updatedAt: new Date().toISOString(),
  }
  if (!next.name.trim()) throw new Error('患者姓名不能为空')
  mockPatients[index] = next
  return next
}

export async function fetchPatientDetails(id: string): Promise<Patient> {
  await wait()
  const matched = mockPatients.find((p) => p.id === id)
  if (!matched) throw new Error('未找到患者')
  return matched
}

export async function fetchMedicalCases(): Promise<MedicalCaseSummary[]> {
  await wait()
  return mockMedicalCases
}

export async function fetchMedicalCaseDetails(id: string): Promise<MedicalCaseDetails> {
  await wait()
  const detail = mockMedicalCaseDetails[id]
  if (!detail) throw new Error('未找到病例')
  return detail
}

export async function updateMedicalCase(
  id: string,
  patch: Partial<
    Pick<MedicalCaseDetails, 'symptoms' | 'diagnosis' | 'formulaName' | 'formulaDetail' | 'usageNote' | 'note'>
  >,
): Promise<MedicalCaseDetails> {
  await wait()
  const existing = mockMedicalCaseDetails[id]
  if (!existing) throw new Error('未找到病例')

  const next: MedicalCaseDetails = {
    ...existing,
    ...patch,
    updatedAt: new Date().toISOString(),
  }

  mockMedicalCaseDetails[id] = next

  const summaryIndex = mockMedicalCases.findIndex((c) => c.id === id)
  if (summaryIndex >= 0) {
    mockMedicalCases[summaryIndex] = {
      ...mockMedicalCases[summaryIndex],
      diagnosis: next.diagnosis,
      formulaName: next.formulaName,
      updatedAt: next.updatedAt,
    }
  }

  return next
}
