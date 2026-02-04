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
  onSave: (
    input: Pick<
      Disease,
      'name' | 'typeName' | 'typeCode' | 'symptoms' | 'differentiation' | 'formula' | 'note'
    >,
  ) => Promise<void>
}) {
  if (!open) return null
  if (mode === 'edit' && !disease) return null
  if (typeof document === 'undefined') return null

  const seed = disease ?? {
    id: '',
    name: '',
    typeName: '',
    typeCode: '',
    symptoms: '',
    differentiation: '',
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
  onSave: (
    input: Pick<
      Disease,
      'name' | 'typeName' | 'typeCode' | 'symptoms' | 'differentiation' | 'formula' | 'note'
    >,
  ) => Promise<void>
}) {
  const normalizeTypeCode = (value?: string) => {
    const code = (value ?? '').trim().toLowerCase()
    if (code === '1' || code === 'disease') return 'disease'
    if (code === '2' || code === 'syndrome') return 'syndrome'
    if (code === '3' || code === 'symptom') return 'symptom'
    return value ?? ''
  }

  const typeOptions = [
    { value: '', label: '未选择' },
    { value: 'disease', label: '疾病' },
    { value: 'syndrome', label: '症候' },
    { value: 'symptom', label: '症状' },
  ]
  const [editing, setEditing] = useState(() => ({
    name: seed.name ?? '',
    typeName: seed.typeName ?? '',
    typeCode: normalizeTypeCode(seed.typeCode),
    symptoms: seed.symptoms ?? '',
    differentiation: seed.differentiation ?? '',
    formula: seed.formula ?? '',
    note: seed.note ?? '',
  }))
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const canSave = useMemo(() => {
    if (pending) return false
    if (!editing.name.trim()) return false
    if (!editing.typeCode.trim()) return false
    if (!editing.typeName.trim()) return false
    if (!editing.symptoms.trim()) return false
    if (!editing.differentiation.trim()) return false
    if (!editing.formula.trim()) return false
    return true
  }, [editing.differentiation, editing.formula, editing.name, editing.symptoms, editing.typeCode, editing.typeName, pending])

  const submit = async () => {
    setError(null)
    setSuccess(null)
    if (!editing.name.trim()) return setError('请输入病症名称。')
    if (!editing.typeCode.trim()) return setError('请选择病症类型。')
    if (!editing.typeName.trim()) return setError('请输入类型名称。')
    if (!editing.symptoms.trim()) return setError('请输入症状描述。')
    if (!editing.differentiation.trim()) return setError('请输入鉴别方法。')
    if (!editing.formula.trim()) return setError('请输入方剂。')
    setPending(true)
    try {
      await onSave({
        name: editing.name.trim(),
        typeName: editing.typeName.trim(),
        typeCode: normalizeTypeCode(editing.typeCode).trim(),
        symptoms: editing.symptoms.trim(),
        differentiation: editing.differentiation.trim(),
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs font-semibold text-slate-600">病症ID</span>
              <input
                value={mode === 'edit' ? seed.id : ''}
                placeholder={mode === 'create' ? '自动生成' : undefined}
                readOnly
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600 outline-none"
              />
            </label>
            <label className="space-y-2">
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600">
                类型 <span className="text-rose-500">*</span>
              </span>
              <select
                value={editing.typeCode}
                onChange={(e) => setEditing((p) => ({ ...p, typeCode: normalizeTypeCode(e.target.value) }))}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              >
                {typeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600">
                类型名称 <span className="text-rose-500">*</span>
              </span>
              <input
                value={editing.typeName}
                onChange={(e) => setEditing((p) => ({ ...p, typeName: e.target.value }))}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              />
            </label>
            <label className="space-y-2">
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600">
                病症名称 <span className="text-rose-500">*</span>
              </span>
              <input
                value={editing.name}
                onChange={(e) => setEditing((p) => ({ ...p, name: e.target.value }))}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              />
            </label>
          </div>
          <label className="space-y-2">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600">
              症状描述 <span className="text-rose-500">*</span>
            </span>
            <textarea
              value={editing.symptoms}
              onChange={(e) => setEditing((p) => ({ ...p, symptoms: e.target.value }))}
              rows={2}
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
          </label>
          <label className="space-y-2">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600">
              鉴别方法 <span className="text-rose-500">*</span>
            </span>
            <textarea
              value={editing.differentiation}
              onChange={(e) => setEditing((p) => ({ ...p, differentiation: e.target.value }))}
              rows={2}
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
          </label>
          <label className="space-y-2">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600">
              方剂 <span className="text-rose-500">*</span>
            </span>
            <input
              value={editing.formula}
              onChange={(e) => setEditing((p) => ({ ...p, formula: e.target.value }))}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
          </label>
          <label className="space-y-2">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600">
              备注
            </span>
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
