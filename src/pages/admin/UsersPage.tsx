import { useMemo, useState } from 'react'
import {
  useAdminUsers,
  useResetAdminUserPassword,
  useSetAdminUserStatus,
  useUpdateAdminUser,
} from '../../api/queries'
import { Badge } from '../../components/Badge'
import { Card } from '../../components/Card'
import { CreatedAtSortToggle } from '../../components/CreatedAtSortToggle'
import { formatDateTime } from '../../lib/datetime'
import type { UserSummary } from '../../types'
import { InlineNotice } from '../../components/InlineNotice'

export function UsersPage() {
  const { data: users } = useAdminUsers()
  const updateUser = useUpdateAdminUser()
  const setStatus = useSetAdminUserStatus()
  const resetPassword = useResetAdminUserPassword()

  const [q, setQ] = useState('')
  const [role, setRole] = useState<'all' | 'admin' | 'doctor'>('all')
  const [status, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all')
  const [order, setOrder] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [editing, setEditing] = useState<UserSummary | null>(null)
  const [draft, setDraft] = useState({
    org: '',
    realName: '',
    region: '',
    phone: '',
    email: '',
    note: '',
  })
  const [notice, setNotice] = useState<{
    tone: 'success' | 'error' | 'info'
    message: string
  } | null>(null)

  const filtered = useMemo(() => {
    const keyword = q.trim()
    const list = (users ?? [])
      .filter((u) => (role === 'all' ? true : u.role === role))
      .filter((u) => (status === 'all' ? true : u.status === status))
      .filter((u) => {
        if (!keyword) return true
        const haystack = [
          u.username ?? u.name,
          u.realName ?? '',
          u.region ?? '',
          u.phone ?? '',
          u.email ?? '',
          u.org ?? '',
        ]
          .filter(Boolean)
          .join(' ')
        return haystack.includes(keyword)
      })
      .sort((a, b) => {
        const dir = order === 'asc' ? 1 : -1
        return (a.createdAt > b.createdAt ? 1 : -1) * dir
      })
    return list
  }, [order, q, role, status, users])

  const total = filtered.length
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, pageCount)
  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, pageSize, safePage])

  const openEdit = (user: UserSummary) => {
    setEditing(user)
    setDraft({
      org: user.org ?? '',
      realName: user.realName ?? '',
      region: user.region ?? '',
      phone: user.phone ?? '',
      email: user.email ?? '',
      note: user.note ?? '',
    })
  }

  return (
    <>
      <Card
        title="用户管理"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value)
                setPage(1)
              }}
              placeholder="检索：用户名/姓名/单位/电话/邮箱/地区"
              className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 sm:w-72"
            />
            <select
              value={role}
              onChange={(e) => {
                setRole(e.target.value as typeof role)
                setPage(1)
              }}
              className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 sm:w-auto"
            >
              <option value="all">全部类型</option>
              <option value="doctor">医生</option>
              <option value="admin">管理员</option>
            </select>
            <select
              value={status}
              onChange={(e) => {
                setStatusFilter(e.target.value as typeof status)
                setPage(1)
              }}
              className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 sm:w-auto"
            >
              <option value="all">全部状态</option>
              <option value="active">启用</option>
              <option value="suspended">封禁</option>
            </select>
            <CreatedAtSortToggle order={order} onToggle={() => setOrder((p) => (p === 'asc' ? 'desc' : 'asc'))} />
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value))
                setPage(1)
              }}
              className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 sm:w-auto"
            >
              <option value={10}>10/页</option>
              <option value={20}>20/页</option>
              <option value={50}>50/页</option>
            </select>
            <span className="text-xs text-slate-500">共 {total} 条</span>
          </div>
        }
      >
        {notice ? <InlineNotice tone={notice.tone} message={notice.message} /> : null}
        <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white/70">
          <table className="w-full min-w-[980px] table-fixed text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="w-[13%] px-4 py-3">用户名</th>
                <th className="w-[13%] px-4 py-3">真实姓名</th>
                <th className="w-[9%] px-4 py-3">类型</th>
                <th className="w-[9%] px-4 py-3">地区</th>
                <th className="w-[12%] px-4 py-3">电话</th>
                <th className="w-[20%] px-4 py-3">邮箱</th>
                <th className="w-[12%] px-4 py-3 text-center">状态</th>
                <th className="w-[12%] px-4 py-3 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pageItems.map((u) => (
                <tr key={u.id} className="hover:bg-white/50">
                  <td className="truncate px-4 py-3 font-semibold text-ink">{u.username ?? u.name}</td>
                  <td className="truncate px-4 py-3 text-slate-700">{u.realName ?? '-'}</td>
                  <td className="px-4 py-3 text-slate-700">{u.role === 'doctor' ? '医生' : '管理员'}</td>
                  <td className="truncate px-4 py-3 text-slate-700">{u.region ?? '-'}</td>
                  <td className="truncate px-4 py-3 text-slate-700">{u.phone ?? '-'}</td>
                  <td className="truncate px-4 py-3 text-slate-700">{u.email ?? '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge tone={u.status === 'active' ? 'success' : 'warning'}>
                      {u.status === 'active' ? '启用' : '封禁'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => openEdit(u)}
                      className="inline-flex h-8 items-center justify-center rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white shadow-soft-card hover:bg-emerald-700"
                    >
                      编辑
                    </button>
                  </td>
                </tr>
              ))}
              {pageItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                    无匹配记录
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-700">
          <div className="text-xs text-slate-500">
            第 {safePage} / {pageCount} 页
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 disabled:opacity-60"
            >
              上一页
            </button>
            <button
              type="button"
              disabled={safePage >= pageCount}
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 disabled:opacity-60"
            >
              下一页
            </button>
          </div>
        </div>
      </Card>

      <UserEditModal
        user={editing}
        draft={draft}
        onClose={() => setEditing(null)}
        onChange={(next) => setDraft(next)}
        saving={updateUser.isPending}
        banning={setStatus.isPending}
        resetting={resetPassword.isPending}
        onSave={async () => {
          if (!editing) return
          try {
            await updateUser.mutateAsync({
              userId: editing.id,
              patch: {
                org: draft.org.trim(),
                realName: draft.realName.trim(),
                region: draft.region.trim(),
                phone: draft.phone.trim(),
                email: draft.email.trim(),
                note: draft.note.trim(),
              },
            })
            setEditing(null)
            setNotice({ tone: 'success', message: '用户信息已保存。' })
          } catch (e) {
            setNotice({ tone: 'error', message: e instanceof Error ? e.message : '保存失败' })
          }
        }}
        onToggleBan={async () => {
          if (!editing) return
          const ok = window.confirm(
            editing.status === 'active' ? '确认封禁该用户？' : '确认解封该用户？',
          )
          if (!ok) return
          try {
            await setStatus.mutateAsync({
              userId: editing.id,
              status: editing.status === 'active' ? 'suspended' : 'active',
            })
            setEditing((prev) =>
              prev
                ? {
                    ...prev,
                    status: prev.status === 'active' ? 'suspended' : 'active',
                  }
                : prev,
            )
            setNotice({ tone: 'success', message: '操作成功。' })
          } catch (e) {
            setNotice({ tone: 'error', message: e instanceof Error ? e.message : '操作失败' })
          }
        }}
        onResetPassword={async () => {
          if (!editing) return
          const ok = window.confirm('确认重置该用户密码？')
          if (!ok) return
          try {
            const res = await resetPassword.mutateAsync({ userId: editing.id })
            setNotice({
              tone: 'success',
              message: `已重置密码（Mock），临时密码：${res.tempPassword}`,
            })
          } catch (e) {
            setNotice({ tone: 'error', message: e instanceof Error ? e.message : '操作失败' })
          }
        }}
      />
    </>
  )
}

function UserEditModal({
  user,
  draft,
  onClose,
  onChange,
  saving,
  onSave,
  banning,
  onToggleBan,
  resetting,
  onResetPassword,
}: {
  user: UserSummary | null
  draft: {
    org: string
    realName: string
    region: string
    phone: string
    email: string
    note: string
  }
  onClose: () => void
  onChange: (next: typeof draft) => void
  saving: boolean
  onSave: () => Promise<void> | void
  banning: boolean
  onToggleBan: () => Promise<void> | void
  resetting: boolean
  onResetPassword: () => Promise<void> | void
}) {
  if (!user) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <button type="button" onClick={onClose} className="absolute inset-0 bg-black/30" aria-label="关闭编辑弹窗" />
      <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-ink">编辑用户</p>
            <p className="text-xs text-slate-500">
              {user.username ?? user.name} · {user.role === 'doctor' ? '医生' : '管理员'} · {user.id}
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

        <div className="max-h-[70vh] overflow-y-auto p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-600">当前状态</span>
              <Badge tone={user.status === 'active' ? 'success' : 'warning'}>
                {user.status === 'active' ? '启用' : '封禁'}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={banning}
                onClick={() => void onToggleBan()}
                className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                {user.status === 'active' ? '封禁' : '解封'}
              </button>
              <button
                type="button"
                disabled={resetting}
                onClick={() => void onResetPassword()}
                className="h-9 rounded-xl bg-primary-600 px-3 text-sm font-semibold text-white shadow-soft-card hover:bg-primary-700 disabled:opacity-60"
              >
                重置密码
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs font-semibold text-slate-600">单位</span>
              <input
                value={draft.org}
                onChange={(e) => onChange({ ...draft, org: e.target.value })}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-semibold text-slate-600">真实姓名</span>
              <input
                value={draft.realName}
                onChange={(e) => onChange({ ...draft, realName: e.target.value })}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-semibold text-slate-600">地区</span>
              <input
                value={draft.region}
                onChange={(e) => onChange({ ...draft, region: e.target.value })}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-semibold text-slate-600">电话</span>
              <input
                value={draft.phone}
                onChange={(e) => onChange({ ...draft, phone: e.target.value })}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              />
            </label>
            <label className="space-y-2 sm:col-span-2">
              <span className="text-xs font-semibold text-slate-600">邮箱</span>
              <input
                value={draft.email}
                onChange={(e) => onChange({ ...draft, email: e.target.value })}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              />
            </label>
            <label className="space-y-2 sm:col-span-2">
              <span className="text-xs font-semibold text-slate-600">备注</span>
              <textarea
                value={draft.note}
                onChange={(e) => onChange({ ...draft, note: e.target.value })}
                rows={3}
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              />
            </label>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs text-slate-600 sm:grid-cols-2">
            <div>
              <p className="text-slate-500">注册时间</p>
              <p className="mt-1 font-semibold text-slate-800">
                {user.registeredAt ? formatDateTime(user.registeredAt) : '-'}
              </p>
            </div>
            <div>
              <p className="text-slate-500">上一次登录时间</p>
              <p className="mt-1 font-semibold text-slate-800">
                {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : '-'}
              </p>
            </div>
            <div>
              <p className="text-slate-500">注册IP</p>
              <p className="mt-1 font-semibold text-slate-800">{user.registerIp ?? '-'}</p>
            </div>
            <div>
              <p className="text-slate-500">上一次登录IP</p>
              <p className="mt-1 font-semibold text-slate-800">{user.lastLoginIp ?? '-'}</p>
            </div>
          </div>
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
            disabled={saving}
            onClick={() => void onSave()}
            className="h-10 rounded-xl bg-primary-600 px-4 text-sm font-semibold text-white shadow-soft-card transition hover:bg-primary-700 disabled:opacity-60"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  )
}
