import { useState } from 'react'
import { Card } from '../../components/Card'

export function SettingsPage() {
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')

  return (
    <Card title="修改密码" action={<span className="text-xs text-slate-500">医生可自助改密</span>}>
      <form className="space-y-4 text-sm text-slate-700">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">当前密码</span>
          <input
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-2 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">新密码</span>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-2 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
          />
        </label>
        <button
          type="submit"
          className="rounded-xl bg-primary-600 px-4 py-2 text-white shadow-soft-card transition hover:bg-primary-700"
        >
          保存
        </button>
      </form>
    </Card>
  )
}
