import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLogin } from '../../api/queries'
import { fetchCurrentUser } from '../../api/authApi'
import { setAuthScope } from '../../api/http'

export function DoctorLoginPage() {
  const navigate = useNavigate()
  const login = useLogin()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    document.title = '大用问证医生端'
    setAuthScope('doctor')
  }, [])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      setAuthScope('doctor')
      await login.mutateAsync({ identifier: username.trim(), password })
      const me = await fetchCurrentUser('doctor')
      navigate(me.role === 'admin' ? '/admin/users' : '/doctor/chat')
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 via-white to-slate-100 p-6">
      <div className="-mt-36 w-full max-w-lg">
        <div className="mb-4 flex items-center justify-center">
          <img
            src="/logo-full.png"
            alt="大用问证"
            className="w-full max-w-xs select-none"
            draggable={false}
          />
        </div>
        <div className="glass-panel mx-auto max-w-md rounded-3xl px-8 pb-10 pt-3">
          <div className="mb-2 flex justify-end">
            <span className="pill bg-primary-100 text-primary-700">Doctor</span>
          </div>
          <form onSubmit={onSubmit} className="-mt-4 mx-auto w-full max-w-xs space-y-4">
            <label className="block space-y-2 text-sm font-medium text-slate-700">
              <span>用户名</span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                placeholder="英文或数字"
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
            <button
              type="submit"
              disabled={login.isPending}
              className="w-full rounded-xl bg-primary-600 px-4 py-3 text-white shadow-soft-card transition hover:bg-primary-700 disabled:opacity-70"
            >
              {login.isPending ? '登录中...' : '登录'}
            </button>
            {error ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-600">{error}</p> : null}
            <div className="text-center text-sm">
              <Link
                to="/doctor/register"
                className="font-medium text-primary-600 transition hover:text-primary-700"
              >
                新用户注册
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
