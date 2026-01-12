import type {
  AuditLogEntry,
  CaseDetails,
  CaseMessage,
  CaseSummary,
  CatalogEntry,
  ConsultationSuggestion,
  UserSummary,
} from '../types'

export const mockCases: CaseSummary[] = [
  {
    id: 'CASE-24001',
    patientName: '王晨',
    gender: '女',
    age: 32,
    status: 'open',
    chiefComplaint: '反复头痛、乏力 2 周',
    updatedAt: '2024-12-28T10:12:00Z',
    doctorName: '李医生',
    tags: ['待追问', '模型补充待确认'],
    unreadMessages: 2,
  },
  {
    id: 'CASE-24002',
    patientName: '赵林',
    gender: '男',
    age: 45,
    status: 'in_review',
    chiefComplaint: '夜间盗汗、易怒',
    updatedAt: '2024-12-27T14:00:00Z',
    doctorName: '李医生',
    tags: ['复诊'],
  },
  {
    id: 'CASE-24003',
    patientName: '张敏',
    gender: '女',
    age: 54,
    status: 'closed',
    chiefComplaint: '慢性咳嗽 1 月',
    updatedAt: '2024-12-24T09:00:00Z',
    doctorName: '陈医生',
    tags: ['已结案'],
  },
]

export const mockCaseDetails: Record<string, CaseDetails> = {
  'CASE-24001': {
    ...mockCases[0],
    demographics: {
      name: '王晨',
      gender: '女',
      age: 32,
      occupation: '设计师',
      vitals: { bp: '112/74', hr: '78', temp: '36.8' },
    },
    symptoms: ['头痛胀痛', '乏力', '口干', '夜寐不安'],
    notes: '近期工作压力大，饮食不规律，情绪紧张。',
    disease: '偏头痛',
    syndrome: '肝阳上亢',
    formulas: ['天麻钩藤饮'],
    followUps: ['一周内复诊', '记录头痛频次与诱因'],
    auditTags: ['库内推荐', '低置信模型补充'],
  },
  'CASE-24002': {
    ...mockCases[1],
    demographics: {
      name: '赵林',
      gender: '男',
      age: 45,
      occupation: '产品经理',
      vitals: { bp: '126/82', hr: '74', temp: '36.7' },
    },
    symptoms: ['盗汗', '易怒', '口苦'],
    notes: '既往焦虑史，睡眠质量差。',
    disease: '焦虑相关躯体症状',
    syndrome: '心肝火旺',
    formulas: ['龙胆泻肝汤（加减）'],
    followUps: ['两周后复诊', '保持睡眠记录'],
  },
  'CASE-24003': {
    ...mockCases[2],
    demographics: {
      name: '张敏',
      gender: '女',
      age: 54,
      occupation: '教师',
      vitals: { bp: '118/76', hr: '70', temp: '36.6' },
    },
    symptoms: ['干咳少痰', '午后潮热'],
    notes: '已结案，疗效稳定。',
    disease: '慢性咳嗽',
    syndrome: '阴虚火旺',
    formulas: ['沙参麦冬汤'],
    followUps: ['如有复发及时就诊'],
  },
}

export const mockMessages: Record<string, CaseMessage[]> = {
  'CASE-24001': [
    {
      id: 'm1',
      sender: 'patientinfo',
      content: '患者主诉：反复头痛 2 周，伴随乏力、口干。',
      createdAt: '2024-12-28T10:00:00Z',
    },
    {
      id: 'm2',
      sender: 'system',
      content: '根据库内症状匹配，建议追问：头痛是否与情绪相关、是否有失眠。',
      createdAt: '2024-12-28T10:02:00Z',
    },
    {
      id: 'm3',
      sender: 'doctor',
      content: '情绪紧张时加重，最近睡眠浅。',
      createdAt: '2024-12-28T10:04:00Z',
    },
    {
      id: 'm4',
      sender: 'model',
      source: 'model',
      content: '模型补充：可考虑肝阳上亢，建议结合情志调护，方剂：天麻钩藤饮。',
      createdAt: '2024-12-28T10:05:00Z',
    },
  ],
  'CASE-24002': [
    {
      id: 'm5',
      sender: 'patientinfo',
      content: '主诉：夜间盗汗 1 周，易怒，口苦。',
      createdAt: '2024-12-27T14:00:00Z',
    },
    {
      id: 'm6',
      sender: 'system',
      content: '库内匹配：心肝火旺倾向，建议追问入睡耗时、是否胸闷。',
      createdAt: '2024-12-27T14:02:00Z',
    },
  ],
  'CASE-24003': [
    {
      id: 'm7',
      sender: 'system',
      content: '结案：症状稳定，建议保持居家雾化。',
      createdAt: '2024-12-24T09:00:00Z',
    },
  ],
}

export const mockSuggestions: Record<string, ConsultationSuggestion> = {
  'CASE-24001': {
    confidence: 0.73,
    source: 'knowledge-base',
    diseases: ['偏头痛'],
    syndromes: ['肝阳上亢'],
    formulas: ['天麻钩藤饮', '柴胡疏肝散（可选）'],
    followUps: ['记录诱因与频次', '关注睡眠质量'],
    rationale: '症状覆盖率 82%，结合既往病史与年龄匹配。',
  },
  'CASE-24002': {
    confidence: 0.61,
    source: 'model',
    diseases: ['焦虑相关躯体症状'],
    syndromes: ['心肝火旺'],
    formulas: ['龙胆泻肝汤（加减）', '黄连温胆汤（低可信）'],
    followUps: ['建议开展睡眠卫生宣教', '2 周后复诊'],
    rationale: '库内匹配不足，结合向量检索与模型推断。',
  },
}

export const mockUsers: UserSummary[] = [
  {
    id: 'u1',
    name: 'admin',
    role: 'admin',
    status: 'active',
    createdAt: '2024-03-01T00:00:00Z',
    lastActive: '2024-12-28T08:30:00Z',
  },
  {
    id: 'u2',
    name: '李医生',
    role: 'doctor',
    status: 'active',
    createdAt: '2024-07-10T00:00:00Z',
    lastActive: '2024-12-28T11:00:00Z',
  },
  {
    id: 'u3',
    name: '陈医生',
    role: 'doctor',
    status: 'suspended',
    createdAt: '2024-08-18T00:00:00Z',
    lastActive: '2024-12-20T10:00:00Z',
  },
]

export const mockCatalog: CatalogEntry[] = [
  {
    id: 'd1',
    name: '偏头痛',
    category: 'disease',
    description: '反复发作的搏动性头痛，伴情绪诱发。',
    linkedTo: ['s1', 'f1'],
  },
  {
    id: 's1',
    name: '肝阳上亢',
    category: 'syndrome',
    description: '头痛眩晕、急躁易怒，舌红少苔。',
    linkedTo: ['f1'],
  },
  {
    id: 'sym1',
    name: '夜间盗汗',
    category: 'symptom',
    description: '夜间入睡后汗出，醒后消失。',
  },
  {
    id: 'f1',
    name: '天麻钩藤饮',
    category: 'formula',
    description: '平肝熄风，适用于肝阳上亢头痛。',
    linkedTo: ['d1', 's1'],
  },
]

export const mockAuditLogs: AuditLogEntry[] = [
  {
    id: 'a1',
    actor: 'admin',
    action: '创建用户 李医生',
    target: 'Users',
    createdAt: '2024-12-18T08:00:00Z',
    severity: 'info',
  },
  {
    id: 'a2',
    actor: '李医生',
    action: '更新病例 CASE-24001 症状列表',
    target: 'Cases',
    createdAt: '2024-12-28T10:12:00Z',
    severity: 'warning',
  },
  {
    id: 'a3',
    actor: '系统',
    action: '模型补充标记：CASE-24002 低置信建议',
    target: 'Consultation',
    createdAt: '2024-12-27T14:05:00Z',
    severity: 'info',
  },
]
