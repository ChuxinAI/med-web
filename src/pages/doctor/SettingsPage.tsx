import { useEffect, useState } from 'react'
import { useChangeMyPassword, useCurrentUser, useUpdateCurrentUser } from '../../api/queries'
import { Card } from '../../components/Card'
import { formatDateTime } from '../../lib/datetime'
import { PasswordResetModal } from '../../components/PasswordResetModal'
import { InlineNotice } from '../../components/InlineNotice'
import { RegionSelect } from '../../components/RegionSelect'
import { parseRegionParts } from '../../lib/region'

export function SettingsPage() {
  const { data: profile } = useCurrentUser('doctor')
  const updateProfile = useUpdateCurrentUser()
  const changePassword = useChangeMyPassword()

  const [editing, setEditing] = useState({
    name: '',
    org: '',
    region: '',
    phone: '',
    email: '',
    note: '',
  })

  const [resetOpen, setResetOpen] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!profile) return
    setEditing({
      name: profile.name ?? '',
      org: profile.org ?? '',
      region: profile.region ?? '',
      phone: profile.phone ?? '',
      email: profile.email ?? '',
      note: profile.note ?? '',
    })
  }, [profile])

  const onSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setError(null)

    try {
      const regionParts = parseRegionParts(editing.region)
      if (!regionParts.province || !regionParts.city || !regionParts.county) {
        setError('请选择完整的省/市/区')
        return
      }
      await updateProfile.mutateAsync({
        name: editing.name.trim(),
        org: editing.org.trim(),
        province: regionParts.province || undefined,
        city: regionParts.city || undefined,
        county: regionParts.county || undefined,
        phone: editing.phone.trim(),
        email: editing.email.trim(),
        note: editing.note.trim(),
      })
      setMessage('个人资料已保存。')
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败')
    }
  }

  if (!profile) {
    return <div className="text-slate-600">正在加载个人信息...</div>
  }

  return (
    <div className="space-y-4">
      <Card title="个人资料">
        <form id="doctor-profile-form" onSubmit={onSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">用户ID</span>
              <input
                value={profile.id}
                disabled
                className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 outline-none"
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">用户名</span>
              <input
                value={profile.username}
                disabled
                className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 outline-none"
              />
            </label>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">单位</span>
              <input
                value={editing.org}
                onChange={(e) => setEditing((prev) => ({ ...prev, org: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">姓名</span>
              <input
                value={editing.name}
                onChange={(e) => setEditing((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">地区</span>
              <RegionSelect value={editing.region} onChange={(region) => setEditing((prev) => ({ ...prev, region }))} />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">电话</span>
              <input
                value={editing.phone}
                onChange={(e) => setEditing((prev) => ({ ...prev, phone: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              />
            </label>
            <label className="block space-y-2 sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">邮箱</span>
              <input
                value={editing.email}
                onChange={(e) => setEditing((prev) => ({ ...prev, email: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              />
            </label>
            <label className="block space-y-2 sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">备注</span>
              <textarea
                value={editing.note}
                onChange={(e) => setEditing((prev) => ({ ...prev, note: e.target.value }))}
                rows={3}
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-100 bg-white/70 p-4 text-xs text-slate-600 sm:grid-cols-2">
            <div>
              <p className="text-slate-500">注册时间</p>
              <p className="mt-1 font-semibold text-slate-800">{formatDateTime(profile.registeredAt ?? 0)}</p>
            </div>
            <div>
              <p className="text-slate-500">上一次登录时间</p>
              <p className="mt-1 font-semibold text-slate-800">{formatDateTime(profile.lastLoginAt ?? 0)}</p>
            </div>
            <div>
              <p className="text-slate-500">注册IP</p>
              <p className="mt-1 font-semibold text-slate-800">{profile.registerIp}</p>
            </div>
            <div>
              <p className="text-slate-500">上一次登录IP</p>
              <p className="mt-1 font-semibold text-slate-800">{profile.lastLoginIp}</p>
            </div>
          </div>

          <div className="flex items-center justify-start gap-2 pt-2">
            <button
              type="button"
              onClick={() => setResetOpen(true)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              重置密码
            </button>
            <button
              type="submit"
              className="h-10 rounded-xl bg-primary-600 px-4 text-sm font-semibold text-white shadow-soft-card transition hover:bg-primary-700"
            >
              保存资料
            </button>
          </div>

          {error ? <InlineNotice tone="error" message={error} /> : null}
          {message ? <InlineNotice tone="success" message={message} /> : null}
        </form>
      </Card>

      <PasswordResetModal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onSuccess={() => setMessage('密码已更新。')}
        onReset={(oldPassword, newPassword) =>
          changePassword.mutateAsync({ oldPassword, newPassword })
        }
      />
    </div>
  )
}
