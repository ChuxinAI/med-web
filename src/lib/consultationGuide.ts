import type { CaseMessage } from '../types'

export const consultationGuideMessage: CaseMessage = {
  id: 'guide',
  sender: 'system',
  content:
    '你好，我是问诊助手。你可以像 ChatGPT 一样输入主诉、现病史、既往史等，我会把内容整理成结构化要点并给出追问建议。',
  createdAt: '2024-01-01T00:00:00.000Z',
}

