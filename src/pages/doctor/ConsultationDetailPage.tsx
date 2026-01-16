import { useParams } from 'react-router-dom'
import { useCaseDetails } from '../../api/queries'
import { DoctorWorkspace } from '../../components/DoctorWorkspace'
import { Card } from '../../components/Card'
import { formatDateTime } from '../../lib/datetime'

export function ConsultationDetailPage() {
  const { caseId } = useParams()
  const { data: detail } = useCaseDetails(caseId)

  if (!detail) {
    return <div className="text-slate-600">正在加载病例...</div>
  }

  return (
    <div className="space-y-5">
      <Card
        title={`${detail.patientName} · ${detail.age}岁 ${detail.gender}`}
        action={<span className="text-xs text-slate-500">可继续问诊 · 可写入病例</span>}
      >
        <div className="flex items-center justify-between text-sm text-slate-700">
          <span>症状：{detail.symptoms.length > 0 ? detail.symptoms.join('、') : '（未填写）'}</span>
          <span>更新时间：{formatDateTime(detail.updatedAt)}</span>
        </div>
      </Card>
      <DoctorWorkspace />
    </div>
  )
}
