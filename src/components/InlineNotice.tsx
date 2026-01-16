export function InlineNotice({
  tone,
  message,
}: {
  tone: 'success' | 'error' | 'info'
  message: string
}) {
  const style =
    tone === 'success'
      ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
      : tone === 'error'
        ? 'border-rose-100 bg-rose-50 text-rose-700'
        : 'border-slate-100 bg-slate-50 text-slate-700'

  return <div className={`rounded-2xl border px-4 py-3 text-sm ${style}`}>{message}</div>
}

