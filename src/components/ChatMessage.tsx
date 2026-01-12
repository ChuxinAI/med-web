import clsx from 'clsx'
import type { CaseMessage } from '../types'

const senderMap: Record<CaseMessage['sender'], { label: string; tone: string }> = {
  doctor: { label: '医生', tone: 'bg-primary-50 text-primary-800' },
  system: { label: '规则', tone: 'bg-blue-50 text-blue-800' },
  model: { label: '模型', tone: 'bg-amber-50 text-amber-800' },
  patientinfo: { label: '患者信息', tone: 'bg-slate-100 text-slate-800' },
}

export function ChatMessage({ message }: { message: CaseMessage }) {
  const sender = senderMap[message.sender]
  return (
    <div className="rounded-2xl border border-slate-100 bg-white/80 p-3 shadow-sm">
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={clsx('pill text-xs font-semibold', sender.tone)}>
            {sender.label}
          </span>
          {message.source === 'model' && (
            <span className="pill bg-orange-100 text-orange-700 text-xs">模型补充</span>
          )}
        </div>
        <span className="text-xs text-slate-400">
          {new Date(message.createdAt).toLocaleString('zh-CN', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
      <p className="text-sm leading-relaxed text-slate-700">{message.content}</p>
    </div>
  )
}
