import type { CaseDetails } from '../types'
import { Badge } from './Badge'

export function PatientSummary({ detail }: { detail: CaseDetails }) {
  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">患者摘要</p>
          <p className="text-xl font-semibold text-ink">{detail.patientName}</p>
          <p className="text-sm text-slate-600">
            {detail.age} 岁 · {detail.gender} · {detail.demographics.occupation}
          </p>
        </div>
        <Badge tone={detail.status === 'closed' ? 'neutral' : 'success'}>
          {detail.status === 'closed' ? '已结案' : '进行中'}
        </Badge>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-slate-700 sm:grid-cols-2">
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500">生命体征</p>
          <p>BP {detail.demographics.vitals?.bp}</p>
          <p>HR {detail.demographics.vitals?.hr}</p>
          <p>T {detail.demographics.vitals?.temp} ℃</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500">病程 & 追踪</p>
          <p>{detail.followUps?.[0] ?? '待填写'}</p>
          <p>上次更新：{new Date(detail.updatedAt).toLocaleDateString('zh-CN')}</p>
        </div>
      </div>
      <div className="mt-4 space-y-2 text-sm text-slate-700">
        <div>
          <p className="text-xs text-slate-500">症状</p>
          <div className="mt-1 flex flex-wrap gap-2">
            {detail.symptoms.map((symptom) => (
              <Badge key={symptom}>{symptom}</Badge>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs text-slate-500">倾向</p>
          <div className="mt-1 flex flex-wrap gap-2">
            {detail.disease && <Badge tone="info">疾病：{detail.disease}</Badge>}
            {detail.syndrome && <Badge tone="info">证型：{detail.syndrome}</Badge>}
            {detail.formulas?.map((f) => (
              <Badge key={f} tone="success">
                方剂：{f}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
