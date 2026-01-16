import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Patient } from '../types'
import { InlineNotice } from './InlineNotice'

export function PatientEditModal({
  open,
  patient,
  onClose,
  onSave,
}: {
  open: boolean
  patient: Patient | null
  onClose: () => void
  onSave: (args: {
    patientId: string
    patch: Partial<Pick<Patient, 'name' | 'gender' | 'age' | 'birthday' | 'region' | 'phone' | 'email' | 'note'>>
  }) => Promise<void>
}) {
  if (!open || !patient) return null
  if (typeof document === 'undefined') return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-6">
      <button type="button" onClick={onClose} className="absolute inset-0 bg-black/30" aria-label="关闭编辑患者" />
      <div className="relative my-10 w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-ink">编辑患者</p>
            <p className="text-xs text-slate-500">
              {patient.name}（{patient.id}）
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            关闭
          </button>
        </div>

        <PatientEditForm key={patient.updatedAt} patient={patient} onClose={onClose} onSave={onSave} />
      </div>
    </div>,
    document.body,
  )
}

function PatientEditForm({
  patient,
  onClose,
  onSave,
}: {
  patient: Patient
  onClose: () => void
  onSave: (args: {
    patientId: string
    patch: Partial<Pick<Patient, 'name' | 'gender' | 'age' | 'birthday' | 'region' | 'phone' | 'email' | 'note'>>
  }) => Promise<void>
}) {
  const [editing, setEditing] = useState(() => ({
    name: patient.name ?? '',
    gender: patient.gender ?? '',
    age: patient.age?.toString() ?? '',
    birthday: patient.birthday ?? '',
    region: patient.region ?? '',
    phone: patient.phone ?? '',
    email: patient.email ?? '',
    note: patient.note ?? '',
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
    if (!editing.name.trim()) return setError('请输入患者姓名。')
    const ageNumber = editing.age.trim() ? Number(editing.age.trim()) : undefined
    if (editing.age.trim() && Number.isNaN(ageNumber)) return setError('年龄格式不正确。')
    setPending(true)
    try {
      await onSave({
        patientId: patient.id,
        patch: {
          name: editing.name.trim(),
          gender: (editing.gender as Patient['gender']) || undefined,
          age: ageNumber,
          birthday: editing.birthday.trim() || undefined,
          region: editing.region.trim() || undefined,
          phone: editing.phone.trim() || undefined,
          email: editing.email.trim() || undefined,
          note: editing.note.trim() || undefined,
        },
      })
      setSuccess('保存成功。')
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
        <div className="grid grid-cols-1 gap-4 text-sm text-slate-700 sm:grid-cols-2">
          <label className="col-span-2 space-y-2">
            <span className="text-xs font-semibold text-slate-600">患者ID</span>
            <input
              value={patient.id}
              readOnly
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600 outline-none"
            />
          </label>
          <label className="col-span-2 space-y-2">
            <span className="text-xs font-semibold text-slate-600">姓名（必填）</span>
            <input
              value={editing.name}
              onChange={(e) => setEditing((p) => ({ ...p, name: e.target.value }))}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-semibold text-slate-600">性别</span>
            <select
              value={editing.gender}
              onChange={(e) => setEditing((p) => ({ ...p, gender: e.target.value }))}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            >
              <option value="">未填写</option>
              <option value="男">男</option>
              <option value="女">女</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-xs font-semibold text-slate-600">年龄</span>
            <input
              value={editing.age}
              onChange={(e) => setEditing((p) => ({ ...p, age: e.target.value }))}
              placeholder="数字（如有生日将按生日计算显示）"
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-semibold text-slate-600">生日</span>
            <input
              value={editing.birthday}
              onChange={(e) => setEditing((p) => ({ ...p, birthday: e.target.value }))}
              placeholder="YYYY-MM-DD"
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-semibold text-slate-600">地区</span>
            <input
              value={editing.region}
              onChange={(e) => setEditing((p) => ({ ...p, region: e.target.value }))}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-semibold text-slate-600">电话</span>
            <input
              value={editing.phone}
              onChange={(e) => setEditing((p) => ({ ...p, phone: e.target.value }))}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-semibold text-slate-600">邮箱</span>
            <input
              value={editing.email}
              onChange={(e) => setEditing((p) => ({ ...p, email: e.target.value }))}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
          </label>
          <label className="col-span-2 space-y-2">
            <span className="text-xs font-semibold text-slate-600">备注</span>
            <textarea
              value={editing.note}
              onChange={(e) => setEditing((p) => ({ ...p, note: e.target.value }))}
              rows={3}
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
