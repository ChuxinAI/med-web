import { useAuditLogs } from '../../api/queries'
import { Badge } from '../../components/Badge'
import { Card } from '../../components/Card'

export function AuditPage() {
  const { data: audits } = useAuditLogs()

  return (
    <Card title="操作与问诊审计" action={<span className="text-xs text-slate-500">存证 + 来源标识</span>}>
      <div className="divide-y divide-slate-100 text-sm text-slate-700">
        {audits?.map((log) => (
          <div key={log.id} className="flex items-center justify-between py-3">
            <div>
              <p className="font-semibold text-ink">{log.action}</p>
              <p className="text-xs text-slate-500">目标：{log.target}</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge tone={log.severity === 'warning' ? 'warning' : 'neutral'}>
                {log.severity}
              </Badge>
              <span className="text-xs text-slate-500">{log.actor}</span>
              <span className="text-xs text-slate-400">
                {new Date(log.createdAt).toLocaleString('zh-CN')}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
