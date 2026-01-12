import { Link } from 'react-router-dom'
import { useDoctorCases } from '../../api/queries'
import { Badge } from '../../components/Badge'
import { Card } from '../../components/Card'

export function ConsultationsPage() {
  const { data: cases } = useDoctorCases()

  return (
    <div className="space-y-4">
      <Card
        title="当前问诊"
        action={<span className="text-xs text-slate-500">基于库内症状/证型/方剂推荐</span>}
      >
        <div className="grid grid-cols-3 gap-4">
          {cases?.map((item) => (
            <Link key={item.id} to={`/doctor/consultations/${item.id}`} className="block">
              <div className="rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-soft-card transition hover:-translate-y-0.5">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500">{item.id}</p>
                  {item.unreadMessages ? (
                    <Badge tone="warning">未读 {item.unreadMessages}</Badge>
                  ) : null}
                </div>
                <p className="mt-1 text-lg font-semibold text-ink">{item.patientName}</p>
                <p className="text-sm text-slate-600">
                  {item.age} 岁 · {item.gender} · {item.doctorName}
                </p>
                <p className="mt-2 text-sm text-slate-700">{item.chiefComplaint}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.tags?.map((tag) => (
                    <Badge key={tag} tone="info">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  )
}
