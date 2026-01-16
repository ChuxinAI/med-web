export function CreatedAtSortToggle({
  order,
  onToggle,
}: {
  order: 'asc' | 'desc'
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
      title="按创建时间排序"
    >
      {order === 'desc' ? '最新' : '最早'}
    </button>
  )
}

