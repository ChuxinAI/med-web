import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export function DoctorLoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('李医生')
  const [password, setPassword] = useState('')

  useEffect(() => {
    document.title = '大用问证医生端'
  }, [])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    void username
    void password
    navigate('/doctor/consultations')
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
            <button
              type="submit"
              className="w-full rounded-xl bg-primary-600 px-4 py-3 text-white shadow-soft-card transition hover:bg-primary-700 disabled:opacity-70"
            >
              登录
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
