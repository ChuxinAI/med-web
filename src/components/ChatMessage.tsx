import clsx from 'clsx'
import type { CaseMessage } from '../types'
import { formatDateTime } from '../lib/datetime'
import { useState } from 'react'
import { SourcePreviewModal } from './SourcePreviewModal'
import { RichText } from './RichText'
import { isMarkdownStable, splitMarkdownStable } from '../lib/consultationStream'

const senderMap: Record<CaseMessage['sender'], { label: string; tone: string }> = {
  doctor: { label: '医生', tone: 'bg-primary-50 text-primary-800' },
  system: { label: '规则', tone: 'bg-blue-50 text-blue-800' },
  model: { label: '', tone: '' },
  patientinfo: { label: '患者信息', tone: 'bg-slate-100 text-slate-800' },
}

export function ChatMessage({
  message,
  hideTimestamp,
  footer,
}: {
  message: CaseMessage
  hideTimestamp?: boolean
  footer?: React.ReactNode
}) {
  const sender = senderMap[message.sender]
  const [open, setOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const markdownSplit = message.isStreaming ? splitMarkdownStable(message.content) : null

  const selectedCitation =
    selectedIndex != null ? message.citations?.[selectedIndex] ?? null : null

  return (
    <div className="rounded-2xl border border-slate-100 bg-white/80 p-3 shadow-sm">
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {sender.label ? (
            <span className={clsx('pill text-xs font-semibold', sender.tone)}>
              {sender.label}
            </span>
          ) : null}
        </div>
        {hideTimestamp ? null : (
          <span className="text-xs text-slate-400">
            {formatDateTime(message.createdAt)}
          </span>
        )}
      </div>
      {message.isStreaming && !isMarkdownStable(message.content) && markdownSplit ? (
        <div className="text-sm leading-relaxed text-slate-700">
          {markdownSplit.stable ? <RichText content={markdownSplit.stable} className="rich-text" /> : null}
          {markdownSplit.unstable ? <div className="whitespace-pre-wrap">{markdownSplit.unstable}</div> : null}
        </div>
      ) : (
        <RichText content={message.content} className="rich-text text-sm leading-relaxed text-slate-700" />
      )}

      {footer ? <div className="mt-2">{footer}</div> : null}

      {message.citations && message.citations.length > 0 ? (
        <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/60 p-2">
          <p className="text-xs font-semibold text-slate-600">引用来源</p>
          <div className="mt-1 flex flex-wrap gap-2">
            {message.citations.map((c, idx) => (
              <button
                key={`${c.diseaseId ?? c.diseaseName ?? 'citation'}-${idx}`}
                type="button"
                onClick={() => {
                  setSelectedIndex(idx)
                  setOpen(true)
                }}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                {c.diseaseName ?? c.fileName ?? '病症信息'}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <SourcePreviewModal open={open} citation={selectedCitation} onClose={() => setOpen(false)} />
    </div>
  )
}
