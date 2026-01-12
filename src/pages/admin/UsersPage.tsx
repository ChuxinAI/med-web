import { useAdminUsers } from '../../api/queries'
import { Badge } from '../../components/Badge'
import { Card } from '../../components/Card'

export function UsersPage() {
  const { data: users } = useAdminUsers()

  return (
    <Card title="用户管理" action={<span className="text-xs text-slate-500">管理员创建/分配账号</span>}>
      <div className="grid grid-cols-3 gap-4 text-sm text-slate-700">
        {users?.map((user) => (
          <div key={user.id} className="rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-soft-card">
            <div className="flex items-center justify-between">
              <p className="text-lg font-semibold text-ink">{user.name}</p>
              <Badge tone={user.status === 'active' ? 'success' : 'warning'}>
                {user.status === 'active' ? '启用' : '封禁'}
              </Badge>
            </div>
            <p className="text-xs text-slate-500">角色：{user.role}</p>
            <p className="mt-2 text-xs text-slate-500">
              创建于 {new Date(user.createdAt).toLocaleDateString('zh-CN')}
            </p>
            <p className="text-xs text-slate-500">
              最近活动 {new Date(user.lastActive).toLocaleString('zh-CN')}
            </p>
            <div className="mt-3 flex gap-2">
              <button className="rounded-lg bg-primary-600 px-3 py-1 text-xs text-white shadow-soft-card">重置密码</button>
              <button className="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-700">封禁/解封</button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
