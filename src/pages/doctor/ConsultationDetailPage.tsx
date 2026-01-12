import { useParams } from 'react-router-dom'
import { useCaseDetails } from '../../api/queries'
import { DoctorWorkspace } from '../../components/DoctorWorkspace'
import { PatientSummary } from '../../components/PatientSummary'
import { Card } from '../../components/Card'

export function ConsultationDetailPage() {
  const { caseId } = useParams()
  const { data: detail } = useCaseDetails(caseId)

  if (!detail) {
    return <div className="text-slate-600">正在加载病例...</div>
  }

  return (
    <div className="grid grid-cols-4 gap-6">
      <div className="col-span-3 space-y-5">
        <Card
          title={`${detail.patientName} · ${detail.age}岁 ${detail.gender}`}
          action={<span className="text-xs text-slate-500">证型/疾病/方剂建议 + 追问</span>}
        >
          <div className="flex items-center justify-between text-sm text-slate-700">
            <span>主诉：{detail.chiefComplaint}</span>
            <span>更新时间：{new Date(detail.updatedAt).toLocaleString('zh-CN')}</span>
          </div>
        </Card>
        <DoctorWorkspace />
      </div>
      <div className="col-span-1 space-y-4">
        <PatientSummary detail={detail} />
        <Card title="审计标签">
          <div className="flex flex-wrap gap-2 text-sm text-slate-700">
            {detail.auditTags?.map((tag) => (
              <span key={tag} className="pill bg-slate-100 text-slate-700">
                {tag}
              </span>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
