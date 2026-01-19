import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { RegionSelect } from '../../components/RegionSelect'

export function DoctorRegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    username: '',
    name: '',
    organization: '',
    region: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')

  useEffect(() => {
    document.title = '医生注册'
  }, [])

  const isPasswordMismatch = useMemo(
    () => form.password !== '' && form.confirmPassword !== '' && form.password !== form.confirmPassword,
    [form.confirmPassword, form.password],
  )

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.username.trim()) {
      setError('用户名为必填项')
      return
    }
    if (isPasswordMismatch) {
      setError('两次输入的密码不一致')
      return
    }
    setError('')
    navigate('/doctor/login')
  }

  const updateField = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }))
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 via-white to-slate-100 p-6">
      <div className="mt-6 w-full max-w-lg sm:mt-0">
        <div className="mb-4 flex items-center justify-center">
          <img
            src="/logo-full.png"
            alt="大用问证"
            className="w-full max-w-xs select-none"
            draggable={false}
          />
        </div>
        <div className="glass-panel mx-auto max-w-md rounded-3xl px-8 pb-8 pt-2">
          <div className="mb-2 flex justify-end">
            <span className="pill bg-primary-100 text-primary-700">Doctor</span>
          </div>
          <form onSubmit={onSubmit} className="-mt-2 mx-auto w-full max-w-xs space-y-3">
            <label className="block space-y-2 text-sm font-medium text-slate-700">
              <span>用户名 *</span>
              <input
                value={form.username}
                onChange={updateField('username')}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                placeholder="请填写用户名"
              />
            </label>
            <label className="block space-y-2 text-sm font-medium text-slate-700">
              <span>姓名</span>
              <input
                value={form.name}
                onChange={updateField('name')}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                placeholder="请填写姓名"
              />
            </label>
            <label className="block space-y-2 text-sm font-medium text-slate-700">
              <span>医院/诊所</span>
              <input
                value={form.organization}
                onChange={updateField('organization')}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                placeholder="如：仁心医院"
              />
            </label>
            <label className="block space-y-2 text-sm font-medium text-slate-700">
              <span>地区</span>
              <RegionSelect value={form.region} onChange={(region) => setForm((prev) => ({ ...prev, region }))} />
            </label>
            <label className="block space-y-2 text-sm font-medium text-slate-700">
              <span>电话</span>
              <input
                value={form.phone}
                onChange={updateField('phone')}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                placeholder="请填写联系电话"
              />
            </label>
            <label className="block space-y-2 text-sm font-medium text-slate-700">
              <span>密码</span>
              <input
                type="password"
                value={form.password}
                onChange={updateField('password')}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                placeholder="••••••"
              />
            </label>
            <label className="block space-y-2 text-sm font-medium text-slate-700">
              <span>密码确认</span>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={updateField('confirmPassword')}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                placeholder="再次输入密码"
              />
            </label>
            {error ? <p className="text-sm text-rose-600">{error}</p> : null}
            <button
              type="submit"
              className="w-full rounded-xl bg-primary-600 px-4 py-3 text-white shadow-soft-card transition hover:bg-primary-700 disabled:opacity-70"
            >
              提交注册
            </button>
            <div className="text-center text-sm text-slate-500">
              已有账号？{' '}
              <Link to="/doctor/login" className="font-medium text-primary-600 transition hover:text-primary-700">
                返回登录
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
