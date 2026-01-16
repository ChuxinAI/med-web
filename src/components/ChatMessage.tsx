import clsx from 'clsx'
import type { CaseMessage } from '../types'
import { formatDateTime } from '../lib/datetime'
import { useState } from 'react'
import { SourcePreviewModal } from './SourcePreviewModal'

const senderMap: Record<CaseMessage['sender'], { label: string; tone: string }> = {
  doctor: { label: '医生', tone: 'bg-primary-50 text-primary-800' },
  system: { label: '规则', tone: 'bg-blue-50 text-blue-800' },
  model: { label: '模型', tone: 'bg-amber-50 text-amber-800' },
  patientinfo: { label: '患者信息', tone: 'bg-slate-100 text-slate-800' },
}

export function ChatMessage({ message }: { message: CaseMessage }) {
  const sender = senderMap[message.sender]
  const [open, setOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  const selectedCitation =
    selectedIndex != null ? message.citations?.[selectedIndex] ?? null : null

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
          {formatDateTime(message.createdAt)}
        </span>
      </div>
      <p className="text-sm leading-relaxed text-slate-700">{message.content}</p>

      {message.citations && message.citations.length > 0 ? (
        <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/60 p-2">
          <p className="text-xs font-semibold text-slate-600">引用来源</p>
          <div className="mt-1 flex flex-wrap gap-2">
            {message.citations.map((c, idx) => (
              <button
                key={`${c.fileId}-${c.page}-${idx}`}
                type="button"
                onClick={() => {
                  setSelectedIndex(idx)
                  setOpen(true)
                }}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                {c.fileName} · 第 {c.page} 页
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <SourcePreviewModal open={open} citation={selectedCitation} onClose={() => setOpen(false)} />
    </div>
  )
}
