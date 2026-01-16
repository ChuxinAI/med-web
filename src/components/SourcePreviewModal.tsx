import type { Citation } from '../types'

export function SourcePreviewModal({
  open,
  citation,
  onClose,
}: {
  open: boolean
  citation: Citation | null
  onClose: () => void
}) {
  if (!open || !citation) return null

  const viewUrl = citation.viewUrl
  const fileType = citation.fileType ?? 'other'

  const iframeSrc =
    fileType === 'pdf'
      ? viewUrl
        ? `${viewUrl}#page=${citation.page}`
        : null
      : fileType === 'doc' || fileType === 'docx'
        ? viewUrl
          ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(viewUrl)}`
          : null
        : viewUrl ?? null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/30"
        aria-label="关闭预览"
      />
      <div className="relative flex h-[80vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <div>
            <p className="text-sm font-semibold text-ink">{citation.fileName}</p>
            <p className="text-xs text-slate-500">定位：第 {citation.page} 页</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            关闭
          </button>
        </div>
        <div className="flex-1 bg-slate-50">
          {iframeSrc ? (
            <iframe
              title="source-preview"
              src={iframeSrc}
              className="h-full w-full"
              allow="clipboard-read; clipboard-write"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-600">
              暂无可用预览链接
            </div>
          )}
        </div>
        {fileType === 'doc' || fileType === 'docx' ? (
          <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
            Word 预览使用 Office Online Viewer，页码定位可能与原文不完全一致。
          </div>
        ) : null}
      </div>
    </div>
  )
}

