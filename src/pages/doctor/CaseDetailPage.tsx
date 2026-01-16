import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMedicalCaseDetails, useUpdateMedicalCase } from '../../api/queries'
import { Card } from '../../components/Card'
import { formatDateTime } from '../../lib/datetime'
import type { MedicalCaseDetails } from '../../types'

export function CaseDetailPage() {
  const navigate = useNavigate()
  const { caseId } = useParams()
  const { data: detail } = useMedicalCaseDetails(caseId)
  const updateCase = useUpdateMedicalCase()

  if (!detail) return <div className="text-slate-600">正在加载病例...</div>

  return <CaseEditor key={detail.updatedAt} detail={detail} navigate={navigate} updateCase={updateCase} />
}

function CaseEditor({
  detail,
  navigate,
  updateCase,
}: {
  detail: MedicalCaseDetails
  navigate: ReturnType<typeof useNavigate>
  updateCase: ReturnType<typeof useUpdateMedicalCase>
}) {
  const [diagnosis, setDiagnosis] = useState(detail.diagnosis)
  const [formulaName, setFormulaName] = useState(detail.formulaName)
  const [symptoms, setSymptoms] = useState(detail.symptoms)
  const [formulaDetail, setFormulaDetail] = useState(detail.formulaDetail)
  const [usageNote, setUsageNote] = useState(detail.usageNote)
  const [note, setNote] = useState(detail.note ?? '')

  const canSave = useMemo(() => {
    return (
      diagnosis.trim().length > 0 &&
      formulaName.trim().length > 0 &&
      (diagnosis.trim() !== detail.diagnosis ||
        formulaName.trim() !== detail.formulaName ||
        symptoms.trim() !== detail.symptoms ||
        formulaDetail.trim() !== detail.formulaDetail ||
        usageNote.trim() !== detail.usageNote ||
        note.trim() !== (detail.note ?? ''))
    )
  }, [detail, diagnosis, formulaDetail, formulaName, note, symptoms, usageNote])

  return (
    <div className="space-y-4">
      <Card
        title={`${detail.patientName} · 病例 ${detail.id}`}
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(`/doctor/patients/${encodeURIComponent(detail.patientId)}`)}
              className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              查看患者
            </button>
            <button
              type="button"
              onClick={() => navigate('/doctor/cases')}
              className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              返回列表
            </button>
          </div>
        }
      >
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
          <span>创建：{formatDateTime(detail.createdAt)}</span>
          <span>更新：{formatDateTime(detail.updatedAt)}</span>
        </div>
      </Card>

      <Card
        title="病例内容"
        action={
          <button
            type="button"
            disabled={!canSave || updateCase.isPending}
            onClick={() =>
              updateCase.mutate({
                caseId: detail.id,
                patch: {
                  diagnosis: diagnosis.trim(),
                  formulaName: formulaName.trim(),
                  symptoms: symptoms.trim(),
                  formulaDetail: formulaDetail.trim(),
                  usageNote: usageNote.trim(),
                  note: note.trim(),
                },
              })
            }
            className="h-9 rounded-xl bg-primary-600 px-4 text-sm font-semibold text-white shadow-soft-card transition hover:bg-primary-700 disabled:opacity-60"
          >
            保存
          </button>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs font-semibold text-slate-600">诊断结果</span>
            <input
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-semibold text-slate-600">治疗方剂名</span>
            <input
              value={formulaName}
              onChange={(e) => setFormulaName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
          </label>
          <label className="space-y-2 sm:col-span-2">
            <span className="text-xs font-semibold text-slate-600">症状（纯文本）</span>
            <textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
          </label>
          <label className="space-y-2 sm:col-span-2">
            <span className="text-xs font-semibold text-slate-600">治疗方剂详情（纯文本）</span>
            <textarea
              value={formulaDetail}
              onChange={(e) => setFormulaDetail(e.target.value)}
              rows={5}
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
          </label>
          <label className="space-y-2 sm:col-span-2">
            <span className="text-xs font-semibold text-slate-600">用法用量（纯文本）</span>
            <textarea
              value={usageNote}
              onChange={(e) => setUsageNote(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
          </label>
          <label className="space-y-2 sm:col-span-2">
            <span className="text-xs font-semibold text-slate-600">备注（纯文本）</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
          </label>
        </div>
      </Card>
    </div>
  )
}
