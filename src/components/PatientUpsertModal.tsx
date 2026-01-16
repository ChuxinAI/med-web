import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Patient } from '../types'

export function PatientUpsertModal({
  open,
  onClose,
  onCreate,
  hint = '创建成功后可在问诊中关联使用',
  variant = 'portal',
}: {
  open: boolean
  onClose: () => void
  onCreate: (input: Pick<Patient, 'name' | 'gender' | 'age' | 'birthday' | 'region' | 'phone' | 'email' | 'note'>) => Promise<void> | void
  hint?: string
  variant?: 'portal' | 'inline'
}) {
  const [name, setName] = useState('')
  const [gender, setGender] = useState<Patient['gender'] | ''>('')
  const [age, setAge] = useState<string>('')
  const [birthday, setBirthday] = useState<string>('')
  const [region, setRegion] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const canSubmit = useMemo(() => name.trim().length > 0 && !pending, [name, pending])

  if (!open) return null
  if (variant === 'portal' && typeof document === 'undefined') return null

  const submit = async () => {
    setError(null)
    const trimmed = name.trim()
    if (!trimmed) {
      setError('请输入患者姓名。')
      return
    }

    const ageNumber = age.trim() ? Number(age.trim()) : undefined
    if (age.trim() && Number.isNaN(ageNumber)) {
      setError('年龄格式不正确。')
      return
    }

    setPending(true)
    try {
      await onCreate({
        name: trimmed,
        gender: gender || undefined,
        age: ageNumber,
        birthday: birthday.trim() || undefined,
        region: region.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        note: note.trim() || undefined,
      })
      setName('')
      setGender('')
      setAge('')
      setBirthday('')
      setRegion('')
      setPhone('')
      setEmail('')
      setNote('')
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : '创建失败')
    } finally {
      setPending(false)
    }
  }

  const content = (
    <div className="w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-ink">新建患者</p>
            <p className="text-xs text-slate-500">{hint}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            关闭
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-5">
          <div className="grid grid-cols-2 gap-4 text-sm text-slate-700">
            <label className="col-span-2 space-y-2">
              <span className="text-xs font-semibold text-slate-600">姓名（必填）</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-semibold text-slate-600">性别</span>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as Patient['gender'] | '')}
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
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="数字"
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-semibold text-slate-600">生日</span>
              <input
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                placeholder="YYYY-MM-DD"
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-semibold text-slate-600">地区</span>
              <input
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-semibold text-slate-600">电话</span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-semibold text-slate-600">邮箱</span>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              />
            </label>
            <label className="col-span-2 space-y-2">
              <span className="text-xs font-semibold text-slate-600">备注</span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              />
            </label>
          </div>

          {error ? (
            <div className="mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}
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
            disabled={!canSubmit}
            onClick={() => void submit()}
            className="h-10 rounded-xl bg-primary-600 px-4 text-sm font-semibold text-white shadow-soft-card transition hover:bg-primary-700 disabled:opacity-60"
          >
            {pending ? '创建中...' : '创建'}
          </button>
        </div>
    </div>
  )

  if (variant === 'inline') {
    return <div className="max-h-[70vh] overflow-y-auto">{content}</div>
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-6">
      <button type="button" onClick={onClose} className="absolute inset-0 bg-black/30" aria-label="关闭新建患者" />
      <div className="relative my-10 w-full max-w-3xl">{content}</div>
    </div>,
    document.body,
  )
}
