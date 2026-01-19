import { createPortal } from 'react-dom'

export function CaseBuilderModal({
  open,
  title = '问诊记录',
  onClose,
  children,
}: {
  open: boolean
  title?: string
  onClose: () => void
  children: React.ReactNode
}) {
  if (!open) return null
  if (typeof document === 'undefined') return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/30"
        aria-label="关闭问诊记录"
      />
      <div className="relative flex h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <p className="text-sm font-semibold text-ink">{title}</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            关闭
          </button>
        </div>
        <div className="flex-1 overflow-y-auto bg-slate-50 p-4">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  )
}
