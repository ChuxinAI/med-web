import { useState } from 'react'
import { Card } from '../../components/Card'
import { formatDateTime } from '../../lib/datetime'
import { PasswordResetModal } from '../../components/PasswordResetModal'
import { InlineNotice } from '../../components/InlineNotice'

export function SettingsPage() {
  const [profile, setProfile] = useState({
    id: 'u2',
    username: '李医生',
    org: '示例医院',
    realName: '李医生',
    region: '上海',
    phone: '13800000000',
    email: 'doctor@example.com',
    note: '擅长内科常见病辨证论治。',
    registeredAt: '2024-07-10T00:00:00Z',
    lastLoginAt: '2024-12-28T11:00:00Z',
    registerIp: '10.0.0.8',
    lastLoginIp: '10.0.0.19',
  })

  const [editing, setEditing] = useState({
    org: profile.org,
    realName: profile.realName,
    region: profile.region,
    phone: profile.phone,
    email: profile.email,
    note: profile.note,
  })

  const [resetOpen, setResetOpen] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const onSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setError(null)

    setProfile((prev) => ({
      ...prev,
      ...editing,
    }))
    setMessage('个人资料已保存（Mock）。')
  }

  return (
    <div className="space-y-4">
      <Card title="个人资料">
        <form id="doctor-profile-form" onSubmit={onSaveProfile} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
          <div className="grid grid-cols-2 gap-4">
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
                value={editing.realName}
                onChange={(e) => setEditing((prev) => ({ ...prev, realName: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">地区</span>
              <input
                value={editing.region}
                onChange={(e) => setEditing((prev) => ({ ...prev, region: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">电话</span>
              <input
                value={editing.phone}
                onChange={(e) => setEditing((prev) => ({ ...prev, phone: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              />
            </label>
            <label className="col-span-2 block space-y-2">
              <span className="text-sm font-medium text-slate-700">邮箱</span>
              <input
                value={editing.email}
                onChange={(e) => setEditing((prev) => ({ ...prev, email: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              />
            </label>
            <label className="col-span-2 block space-y-2">
              <span className="text-sm font-medium text-slate-700">备注</span>
              <textarea
                value={editing.note}
                onChange={(e) => setEditing((prev) => ({ ...prev, note: e.target.value }))}
                rows={3}
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-100 bg-white/70 p-4 text-xs text-slate-600">
            <div>
              <p className="text-slate-500">注册时间</p>
              <p className="mt-1 font-semibold text-slate-800">{formatDateTime(profile.registeredAt)}</p>
            </div>
            <div>
              <p className="text-slate-500">上一次登录时间</p>
              <p className="mt-1 font-semibold text-slate-800">{formatDateTime(profile.lastLoginAt)}</p>
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
        onSuccess={() => setMessage('密码已更新（Mock）。')}
      />
    </div>
  )
}
