import { useDoctorCases } from '../../api/queries'
import { Badge } from '../../components/Badge'
import { Card } from '../../components/Card'

const statusTone: Record<string, 'success' | 'warning' | 'neutral'> = {
  open: 'success',
  in_review: 'warning',
  closed: 'neutral',
}

export function CasesPage() {
  const { data: cases } = useDoctorCases()

  return (
    <Card title="我的病例" action={<span className="text-xs text-slate-500">按医生过滤</span>}>
      <div className="divide-y divide-slate-100 text-sm text-slate-700">
        {cases?.map((item) => (
          <div key={item.id} className="flex items-center justify-between py-3">
            <div>
              <p className="font-semibold text-ink">{item.patientName}</p>
              <p className="text-xs text-slate-500">{item.id}</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge tone={statusTone[item.status]}>状态：{item.status}</Badge>
              <span className="text-xs text-slate-500">
                更新：{new Date(item.updatedAt).toLocaleDateString('zh-CN')}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
