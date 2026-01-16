import clsx from 'clsx'

export function TablePagination({
  page,
  pageCount,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  className,
}: {
  page: number
  pageCount: number
  pageSize: number
  total: number
  onPageChange: (next: number) => void
  onPageSizeChange?: (next: number) => void
  className?: string
}) {
  const safePageCount = Math.max(1, pageCount)
  const safePage = Math.min(Math.max(1, page), safePageCount)

  return (
    <div className={clsx('mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-700', className)}>
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span>
          第 {safePage} / {safePageCount} 页
        </span>
        <span>共 {total} 条</span>
        {onPageSizeChange ? (
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
          >
            <option value={10}>10/页</option>
            <option value={20}>20/页</option>
            <option value={50}>50/页</option>
          </select>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={safePage <= 1}
          onClick={() => onPageChange(Math.max(1, safePage - 1))}
          className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 disabled:opacity-60"
        >
          上一页
        </button>
        <button
          type="button"
          disabled={safePage >= safePageCount}
          onClick={() => onPageChange(Math.min(safePageCount, safePage + 1))}
          className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 disabled:opacity-60"
        >
          下一页
        </button>
      </div>
    </div>
  )
}

