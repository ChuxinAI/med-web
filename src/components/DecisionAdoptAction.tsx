export function DecisionAdoptAction({
  loading,
  error,
  onAdopt,
}: {
  loading?: boolean
  error?: string | null
  onAdopt: () => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <button
        type="button"
        onClick={onAdopt}
        disabled={loading}
        className="text-primary-700 underline decoration-dotted underline-offset-2 transition hover:text-primary-800 disabled:cursor-not-allowed disabled:text-slate-400"
      >
        {loading ? '采纳中...' : '采纳'}
      </button>
      {error ? <span className="text-[11px] text-rose-600">{error}</span> : null}
    </div>
  )
}
