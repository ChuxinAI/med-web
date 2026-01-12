import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../../api/mockApi'
import type { UserRole } from '../../types'

export function LoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('李医生')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('doctor')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const res = await login(username, password)
    setLoading(false)
    navigate(res.role === 'admin' || role === 'admin' ? '/admin/users' : '/doctor/consultations')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 via-white to-slate-100 p-6">
      <div className="glass-panel w-full max-w-3xl rounded-3xl p-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">统一认证 · JWT/刷新</p>
            <h1 className="text-2xl font-bold text-ink">诊所问诊系统登录</h1>
          </div>
          <span className="pill bg-primary-100 text-primary-700">角色：admin / doctor</span>
        </div>
        <form onSubmit={onSubmit} className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <label className="block space-y-2 text-sm font-medium text-slate-700">
              <span>用户名</span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                placeholder="由管理员分配"
              />
            </label>
            <label className="block space-y-2 text-sm font-medium text-slate-700">
              <span>密码</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                placeholder="••••••"
              />
            </label>
            <div className="flex gap-3 text-sm text-slate-600">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="role"
                  value="doctor"
                  checked={role === 'doctor'}
                  onChange={() => setRole('doctor')}
                />
                医生端
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="role"
                  value="admin"
                  checked={role === 'admin'}
                  onChange={() => setRole('admin')}
                />
                管理端
              </label>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-primary-600 px-4 py-3 text-white shadow-soft-card transition hover:bg-primary-700 disabled:opacity-70"
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </div>
          <div className="space-y-4 rounded-2xl bg-slate-50 p-6 text-sm text-slate-700">
            <p className="font-semibold text-ink">安全与频控</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>用户名/密码，登录频控，失败提示泛化。</li>
              <li>access/refresh token，前端缓存 & 失效刷新。</li>
              <li>无自助注册，账号由管理员创建/分配。</li>
              <li>医生可改密，管理员可重置/封禁。</li>
            </ul>
          </div>
        </form>
      </div>
    </div>
  )
}
