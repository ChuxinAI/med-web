import type { CaseMessage, Citation } from '../types'
import { formatDateTime } from '../lib/datetime'

export function CaseChatBubble({
  message,
  onOpenCitation,
}: {
  message: CaseMessage
  onOpenCitation: (citation: Citation) => void
}) {
  const isUser = message.sender === 'doctor'
  const showHeader = !isUser && message.sender !== 'system'
  const label =
    message.sender === 'doctor'
      ? '医生'
      : message.sender === 'model'
        ? '模型'
        : message.sender === 'patientinfo'
          ? '患者信息'
          : ''
  const tone = isUser ? 'bg-primary-600 text-white' : 'bg-white text-slate-700 border border-slate-100'

  return (
    <div className={isUser ? 'flex justify-end' : 'flex justify-start'}>
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm ${tone}`}>
        {showHeader ? (
          <div className="mb-2 flex items-center gap-2">
            {label ? <span className="pill bg-slate-100 text-slate-700 text-xs font-semibold">{label}</span> : null}
            {message.source ? (
              <span className="pill bg-blue-50 text-blue-700 text-xs font-semibold">
                {message.source === 'model' ? '模型兜底' : message.source === 'knowledge-base' ? '知识库' : message.source}
              </span>
            ) : null}
          </div>
        ) : null}

        <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>

        {message.citations && message.citations.length > 0 ? (
          <div className={isUser ? 'mt-3 text-white/90' : 'mt-3 text-slate-600'}>
            <p className={isUser ? 'text-xs font-semibold text-white/80' : 'text-xs font-semibold text-slate-500'}>
              引用来源
            </p>
            <div className="mt-1 flex flex-wrap gap-2">
              {message.citations.map((c) => (
                <button
                  key={`${c.fileId}-${c.page}`}
                  type="button"
                  onClick={() => onOpenCitation(c)}
                  className={
                    isUser
                      ? 'rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white hover:bg-white/20'
                      : 'rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50'
                  }
                >
                  {c.fileName} · 第 {c.page} 页
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className={isUser ? 'mt-3 text-right text-xs text-white/70' : 'mt-3 text-right text-xs text-slate-400'}>
          {formatDateTime(message.createdAt)}
        </div>
      </div>
    </div>
  )
}
