import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useCaseMessages, useCaseSuggestions } from '../api/queries'
import { ChatMessage } from './ChatMessage'
import { SuggestionPanel } from './SuggestionPanel'
import { Card } from './Card'

export function DoctorWorkspace() {
  const { caseId } = useParams()
  const { data: messages } = useCaseMessages(caseId)
  const { data: suggestion } = useCaseSuggestions(caseId)

  const groupedMessages = useMemo(() => messages ?? [], [messages])

  return (
    <div className="grid grid-cols-3 gap-5">
      <div className="col-span-2 space-y-4">
        <Card title="问诊对话" action={<span className="text-xs text-slate-500">来源标注：规则 / 模型</span>}>
          <div className="flex flex-col gap-3">
            {groupedMessages.map((m) => (
              <ChatMessage key={m.id} message={m} />
            ))}
            <div className="rounded-2xl border border-dashed border-primary-200 bg-primary-50/40 p-4 text-sm text-slate-600">
              <p className="font-semibold text-primary-700">记录采纳 / 拒绝</p>
              <p>医生确认建议后，将写入病例并记录审计。</p>
            </div>
          </div>
        </Card>
      </div>
      <div className="space-y-4">
        <SuggestionPanel suggestion={suggestion} />
        <Card title="操作快捷">{quickActions}</Card>
      </div>
    </div>
  )
}

const quickActions = (
  <div className="space-y-2 text-sm text-slate-700">
    <button className="w-full rounded-xl bg-primary-500 px-3 py-2 text-white shadow-soft-card transition hover:translate-y-[1px] hover:bg-primary-600">
      确认并写入病例
    </button>
    <button className="w-full rounded-xl border border-primary-200 px-3 py-2 text-primary-700 transition hover:bg-primary-50">
      添加追问
    </button>
    <button className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-700 transition hover:bg-slate-50">
      标记待确认来源
    </button>
  </div>
)
