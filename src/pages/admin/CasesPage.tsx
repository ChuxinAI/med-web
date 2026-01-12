import { Link } from 'react-router-dom'
import { useDoctorCases } from '../../api/queries'
import { Badge } from '../../components/Badge'
import { Card } from '../../components/Card'

export function AdminCasesPage() {
  const { data: cases } = useDoctorCases()

  return (
    <Card title="病例审核" action={<span className="text-xs text-slate-500">按医生/状态过滤</span>}>
      <div className="grid grid-cols-2 gap-4 text-sm text-slate-700">
        {cases?.map((item) => (
          <div key={item.id} className="rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-soft-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-ink">{item.patientName}</p>
                <p className="text-xs text-slate-500">{item.id}</p>
              </div>
              <Badge tone="info">{item.status}</Badge>
            </div>
            <p className="mt-2 text-slate-600">{item.chiefComplaint}</p>
            <p className="text-xs text-slate-500">医生：{item.doctorName}</p>
            <div className="mt-3 flex gap-2">
              <Link
                to={`/doctor/consultations/${item.id}`}
                className="rounded-lg bg-primary-600 px-3 py-1 text-xs text-white"
              >
                查看问诊流
              </Link>
              <button className="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-700">
                打回/通过
              </button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
