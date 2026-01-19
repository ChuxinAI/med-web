import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Disease } from '../types'
import { InlineNotice } from './InlineNotice'

export function DiseaseEditModal({
  open,
  mode,
  disease,
  onClose,
  onSave,
}: {
  open: boolean
  mode: 'create' | 'edit'
  disease?: Disease | null
  onClose: () => void
  onSave: (input: Pick<Disease, 'name' | 'symptoms' | 'formula' | 'note'>) => Promise<void>
}) {
  if (!open) return null
  if (mode === 'edit' && !disease) return null
  if (typeof document === 'undefined') return null

  const seed = disease ?? {
    id: '',
    name: '',
    symptoms: '',
    formula: '',
    note: '',
    createdAt: '',
    updatedAt: '',
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-6">
      <button type="button" onClick={onClose} className="absolute inset-0 bg-black/30" aria-label="关闭病症弹窗" />
      <div className="relative my-10 w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-ink">{mode === 'create' ? '新增病症' : '编辑病症'}</p>
            {mode === 'edit' ? <p className="text-xs text-slate-500">{seed.name}（{seed.id}）</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            关闭
          </button>
        </div>

        <DiseaseEditForm key={seed.updatedAt || seed.id} seed={seed} mode={mode} onClose={onClose} onSave={onSave} />
      </div>
    </div>,
    document.body,
  )
}

function DiseaseEditForm({
  seed,
  mode,
  onClose,
  onSave,
}: {
  seed: Disease
  mode: 'create' | 'edit'
  onClose: () => void
  onSave: (input: Pick<Disease, 'name' | 'symptoms' | 'formula' | 'note'>) => Promise<void>
}) {
  const [editing, setEditing] = useState(() => ({
    name: seed.name ?? '',
    symptoms: seed.symptoms ?? '',
    formula: seed.formula ?? '',
    note: seed.note ?? '',
  }))
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const canSave = useMemo(() => {
    if (pending) return false
    if (!editing.name.trim()) return false
    return true
  }, [editing.name, pending])

  const submit = async () => {
    setError(null)
    setSuccess(null)
    if (!editing.name.trim()) return setError('请输入病症名。')
    setPending(true)
    try {
      await onSave({
        name: editing.name.trim(),
        symptoms: editing.symptoms.trim(),
        formula: editing.formula.trim(),
        note: editing.note.trim() || undefined,
      })
      setSuccess(mode === 'create' ? '已新增。' : '保存成功。')
      window.setTimeout(() => onClose(), 300)
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败')
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      <div className="max-h-[70vh] overflow-y-auto p-5">
        <div className="grid grid-cols-1 gap-4 text-sm text-slate-700">
          {mode === 'edit' ? (
            <label className="space-y-2">
              <span className="text-xs font-semibold text-slate-600">病症ID</span>
              <input
                value={seed.id}
                readOnly
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600 outline-none"
              />
            </label>
          ) : null}
          <label className="space-y-2">
            <span className="text-xs font-semibold text-slate-600">病症名</span>
            <input
              value={editing.name}
              onChange={(e) => setEditing((p) => ({ ...p, name: e.target.value }))}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-semibold text-slate-600">症状/诊断方法</span>
            <textarea
              value={editing.symptoms}
              onChange={(e) => setEditing((p) => ({ ...p, symptoms: e.target.value }))}
              rows={3}
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-semibold text-slate-600">应对方剂</span>
            <input
              value={editing.formula}
              onChange={(e) => setEditing((p) => ({ ...p, formula: e.target.value }))}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-semibold text-slate-600">备注</span>
            <textarea
              value={editing.note}
              onChange={(e) => setEditing((p) => ({ ...p, note: e.target.value }))}
              rows={2}
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
          </label>
        </div>

        {error ? <InlineNotice tone="error" message={error} /> : null}
        {success ? <InlineNotice tone="success" message={success} /> : null}
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-5 py-4">
        <button
          type="button"
          onClick={onClose}
          className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          取消
        </button>
        <button
          type="button"
          disabled={!canSave}
          onClick={() => void submit()}
          className="h-10 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-soft-card hover:bg-emerald-700 disabled:opacity-60"
        >
          {pending ? '保存中...' : '保存'}
        </button>
      </div>
    </>
  )
}
