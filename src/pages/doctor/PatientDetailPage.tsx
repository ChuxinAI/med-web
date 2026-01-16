import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { usePatientDetails } from '../../api/queries'
import { Card } from '../../components/Card'
import { formatDateTime } from '../../lib/datetime'

export function PatientDetailPage() {
  const navigate = useNavigate()
  const { patientId } = useParams()
  const { data: patient } = usePatientDetails(patientId)

  const summary = useMemo(() => {
    if (!patient) return null
    return [
      { label: '患者ID', value: patient.id },
      { label: '地区', value: patient.region ?? '-' },
      { label: '电话', value: patient.phone ?? '-' },
      { label: '邮箱', value: patient.email ?? '-' },
      { label: '生日', value: patient.birthday ?? '-' },
      { label: '创建时间', value: formatDateTime(patient.createdAt) },
      { label: '更新时间', value: formatDateTime(patient.updatedAt) },
    ]
  }, [patient])

  if (!patient) return <div className="text-slate-600">正在加载患者信息...</div>

  return (
    <div className="space-y-4">
      <Card
        title={`${patient.name}${patient.age != null ? ` · ${patient.age} 岁` : ''}`}
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(`/doctor/chat?patientId=${encodeURIComponent(patient.id)}`)}
              className="h-9 rounded-xl bg-primary-600 px-4 text-sm font-semibold text-white shadow-soft-card transition hover:bg-primary-700"
            >
              发起问诊
            </button>
            <button
              type="button"
              onClick={() => navigate('/doctor/patients')}
              className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              返回列表
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          {summary?.map((row) => (
            <div key={row.label} className="rounded-xl bg-white/60 px-3 py-2">
              <p className="text-xs text-slate-500">{row.label}</p>
              <p className="mt-0.5 text-sm font-medium text-slate-800">{row.value}</p>
            </div>
          ))}
        </div>
        {patient.note ? (
          <div className="mt-4 rounded-xl border border-slate-100 bg-white/60 p-3">
            <p className="text-xs text-slate-500">备注</p>
            <p className="mt-1 text-sm text-slate-700">{patient.note}</p>
          </div>
        ) : null}
      </Card>
    </div>
  )
}

