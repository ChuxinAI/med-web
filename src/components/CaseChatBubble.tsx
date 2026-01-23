import type { CaseMessage, Citation } from '../types'
import { formatDateTime } from '../lib/datetime'
import { isMarkdownStable, splitMarkdownStable } from '../lib/consultationStream'
import { RichText } from './RichText'

export function CaseChatBubble({
  message,
  onOpenCitation,
  hideTimestamp,
  footer,
}: {
  message: CaseMessage
  onOpenCitation: (citation: Citation) => void
  hideTimestamp?: boolean
  footer?: React.ReactNode
}) {
  const isUser = message.sender === 'doctor'
  const showHeader = !isUser && message.sender !== 'system' && message.sender !== 'model'
  const label =
    message.sender === 'doctor'
      ? '医生'
      : message.sender === 'patientinfo'
        ? '患者信息'
        : ''
  const tone = isUser ? 'bg-primary-600 text-white' : 'bg-white text-slate-700 border border-slate-100'
  const markdownSplit = message.isStreaming ? splitMarkdownStable(message.content) : null

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

        {message.isStreaming && !isMarkdownStable(message.content) && markdownSplit ? (
          <div className="leading-relaxed">
            {markdownSplit.stable ? <RichText content={markdownSplit.stable} className="rich-text" /> : null}
            {markdownSplit.unstable ? <div className="whitespace-pre-wrap">{markdownSplit.unstable}</div> : null}
          </div>
        ) : (
          <RichText content={message.content} className="rich-text leading-relaxed" />
        )}

        {footer ? <div className="mt-2">{footer}</div> : null}

        {message.citations && message.citations.length > 0 ? (
          <div className={isUser ? 'mt-3 text-white/90' : 'mt-3 text-slate-600'}>
            <p className={isUser ? 'text-xs font-semibold text-white/80' : 'text-xs font-semibold text-slate-500'}>
              引用来源
            </p>
            <div className="mt-1 flex flex-wrap gap-2">
              {message.citations.map((c, idx) => (
                <button
                  key={`${c.diseaseId ?? c.diseaseName ?? 'citation'}-${idx}`}
                  type="button"
                  onClick={() => onOpenCitation(c)}
                  className={
                    isUser
                      ? 'rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white hover:bg-white/20'
                      : 'rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50'
                  }
                >
                  {c.diseaseName ?? c.fileName ?? '病症信息'}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {!hideTimestamp ? (
          <div
            className={isUser ? 'mt-3 text-right text-xs text-white/70' : 'mt-3 text-right text-xs text-slate-400'}
          >
            {formatDateTime(message.createdAt)}
          </div>
        ) : null}
      </div>
    </div>
  )
}
