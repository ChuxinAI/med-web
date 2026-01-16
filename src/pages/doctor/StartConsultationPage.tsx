import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useCreateConsultation, useDoctorPatients } from '../../api/queries'
import { Card } from '../../components/Card'
import { DoctorWorkspace } from '../../components/DoctorWorkspace'
import type { Patient } from '../../types'

export function StartConsultationPage() {
  const [searchParams] = useSearchParams()
  const presetPatientId = searchParams.get('patientId') ?? ''

  const { data: patients } = useDoctorPatients()
  const createConsultation = useCreateConsultation()
  const [consultationId, setConsultationId] = useState<string | null>(null)
  const [selectedPatientId, setSelectedPatientId] = useState(presetPatientId)

  const selectedPatient = useMemo<Patient | undefined>(() => {
    const list = patients ?? []
    const id = selectedPatientId || presetPatientId
    if (!id) return undefined
    return list.find((p) => p.id === id)
  }, [patients, presetPatientId, selectedPatientId])

  useEffect(() => {
    if (!presetPatientId) return
    if (consultationId) return
    if (createConsultation.isPending) return

    createConsultation.mutate(
      { patientId: presetPatientId },
      { onSuccess: (result) => setConsultationId(result.consultationId) },
    )
  }, [consultationId, createConsultation, presetPatientId])

  return (
    consultationId ? (
      <DoctorWorkspace consultationId={consultationId} />
    ) : (
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-4">
          <Card
            title="问诊对话"
            action={<span className="text-xs text-slate-500">一次只处理一个会话</span>}
          >
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-4 text-sm text-slate-600">
              <p className="font-semibold text-ink">准备开始问诊</p>
              <p className="mt-1">请在右侧选择患者（可选），然后点击“开始问诊”。</p>
            </div>
            <div className="mt-4 rounded-2xl border border-slate-100 bg-white/70 p-3">
              <div className="flex items-end gap-3">
                <textarea
                  rows={2}
                  disabled
                  placeholder="开始问诊后可在此输入"
                  className="min-h-[52px] flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 outline-none"
                />
                <button
                  type="button"
                  disabled
                  className="h-[52px] rounded-2xl bg-slate-200 px-5 text-sm font-semibold text-slate-500"
                >
                  发送
                </button>
              </div>
            </div>
          </Card>
        </div>
        <div className="space-y-4">
          <Card title="病例构建器">
            <div className="space-y-3">
              <label className="block space-y-2">
                <span className="text-xs font-semibold text-slate-600">关联患者（可选）</span>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                >
                  <option value="">不关联患者</option>
                  {(patients ?? []).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}（{p.id}）
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500">
                  写入病例前必须先关联患者；可在问诊过程中再选择/创建。
                </p>
              </label>

              {selectedPatient ? (
                <div className="rounded-xl border border-slate-100 bg-white/60 p-3 text-sm text-slate-700">
                  已选择：<span className="font-semibold text-ink">{selectedPatient.name}</span>
                  {selectedPatient.phone ? <span className="text-slate-500"> · {selectedPatient.phone}</span> : null}
                </div>
              ) : null}

              <button
                type="button"
                disabled={createConsultation.isPending}
                onClick={() =>
                  createConsultation.mutate(
                    { patientId: selectedPatientId || undefined },
                    { onSuccess: (result) => setConsultationId(result.consultationId) },
                  )
                }
                className="h-10 w-full rounded-xl bg-primary-600 px-4 text-sm font-semibold text-white shadow-soft-card transition hover:bg-primary-700 disabled:opacity-60"
              >
                开始问诊
              </button>
            </div>
          </Card>
        </div>
      </div>
    )
  )
}
