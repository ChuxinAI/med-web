import { useMemo, useState } from 'react'
import type { ConsultationDraft, ConsultationSuggestion, Patient } from '../types'
import { PatientUpsertModal } from './PatientUpsertModal'
import { getPatientAge } from '../lib/patient'

type PatientCreateInput = Pick<
  Patient,
  'name' | 'gender' | 'age' | 'birthday' | 'region' | 'phone' | 'email' | 'note'
>

export function CaseBuilderPanel({
  consultationId,
  draft,
  patients,
  suggestion,
  saving,
  writing,
  readOnly = false,
  onCreatePatient,
  onSaveDraft,
  onWriteCase,
}: {
  consultationId: string
  draft: ConsultationDraft
  patients: Patient[]
  suggestion?: ConsultationSuggestion
  saving: boolean
  writing: boolean
  readOnly?: boolean
  onCreatePatient: (input: PatientCreateInput) => Promise<Patient>
  onSaveDraft: (draft: ConsultationDraft) => Promise<void> | void
  onWriteCase: (draft: ConsultationDraft) => Promise<void> | void
}) {
  const [localDraft, setLocalDraft] = useState<ConsultationDraft>(() => draft)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmError, setConfirmError] = useState<string | null>(null)
  const [patientPickerOpen, setPatientPickerOpen] = useState(false)
  const [patientQuery, setPatientQuery] = useState('')
  const [createPatientOpen, setCreatePatientOpen] = useState(false)

  const diagnosisCandidates = useMemo(() => {
    if (!suggestion) return []
    const candidates = []
    if (suggestion.diseases.length > 0) candidates.push(`疾病：${suggestion.diseases.join('、')}`)
    if (suggestion.syndromes.length > 0) candidates.push(`证型：${suggestion.syndromes.join('、')}`)
    return candidates
  }, [suggestion])

  const formulaCandidates = useMemo(() => suggestion?.formulas ?? [], [suggestion])
  const filteredPatients = useMemo(() => {
    const keyword = patientQuery.trim()
    if (!keyword) return patients
    return patients.filter((p) => [p.id, p.name, p.phone, p.region, p.email].filter(Boolean).join(' ').includes(keyword))
  }, [patientQuery, patients])
  const selectedPatient = useMemo(
    () => (localDraft.patientId ? patients.find((p) => p.id === localDraft.patientId) : undefined),
    [localDraft.patientId, patients],
  )

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-1 min-h-0 space-y-3 overflow-y-auto pr-1">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">患者信息</span>
            <span className={`pill text-xs font-semibold ${statusPill(localDraft.status.patientId)}`}>
              {localDraft.status.patientId === 'empty' ? '未关联' : '已关联'}
            </span>
          </div>

        <button
          type="button"
          onClick={() => setPatientPickerOpen((p) => !p)}
          disabled={readOnly}
          className="flex h-10 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 transition hover:bg-slate-50 disabled:bg-slate-50 disabled:text-slate-500"
        >
          <span className="truncate">
              {selectedPatient
                ? `${selectedPatient.name}（${[getPatientAge(selectedPatient) ? `${getPatientAge(selectedPatient)}岁` : null, selectedPatient.phone ?? '未留手机号'].filter(Boolean).join(' · ')}）`
                : '选择/新建患者'}
          </span>
          <span className="whitespace-nowrap text-xs text-slate-400">{patientPickerOpen ? '收起' : '展开'}</span>
        </button>

          {patientPickerOpen && !readOnly ? (
            <div className="rounded-2xl border border-slate-100 bg-white/80 p-3">
              <input
                value={patientQuery}
                onChange={(e) => setPatientQuery(e.target.value)}
                placeholder="检索：姓名/电话/地区/邮箱/ID"
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              />
              <div className="mt-3 overflow-hidden rounded-xl border border-slate-100 bg-white">
                <button
                  type="button"
                  onClick={() => setCreatePatientOpen(true)}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-semibold text-primary-700 hover:bg-primary-50"
                >
                  <span>＋ 新建患者</span>
                  <span className="text-xs text-slate-500">创建后自动关联</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLocalDraft((prev) => ({
                      ...prev,
                      patientId: undefined,
                      status: { ...prev.status, patientId: 'empty' },
                    }))
                    setPatientPickerOpen(false)
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                >
                  未关联
                </button>
                <div className="max-h-56 overflow-y-auto">
                  {filteredPatients.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setLocalDraft((prev) => ({
                          ...prev,
                          patientId: p.id,
                          status: { ...prev.status, patientId: 'confirmed' },
                        }))
                        setPatientPickerOpen(false)
                      }}
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <span className="font-semibold text-ink">{p.name}</span>
                      <span className="flex items-center gap-2 text-xs text-slate-500">
                        <span>{getPatientAge(p) ? `${getPatientAge(p)}岁` : ''}</span>
                        <span>{p.phone ?? '未留手机号'}</span>
                      </span>
                    </button>
                  ))}
                  {filteredPatients.length === 0 ? (
                    <div className="px-3 py-3 text-sm text-slate-500">无匹配患者</div>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          <PatientUpsertModal
            open={createPatientOpen}
            onClose={() => setCreatePatientOpen(false)}
            hint="创建成功后会自动关联到当前问诊"
            onCreate={async (input) => {
              const created = await onCreatePatient(input)
              const next = {
                ...localDraft,
                patientId: created.id,
                status: { ...localDraft.status, patientId: 'confirmed' as const },
              }
              setLocalDraft(next)
              setPatientPickerOpen(false)
              await onSaveDraft(next)
            }}
          />
        </div>

        <FieldEditor
        label="症状"
        value={localDraft.symptoms}
        status={localDraft.status.symptoms}
        rows={2}
        readOnly={readOnly}
        onChange={(value) =>
          setLocalDraft((prev) => ({
            ...prev,
            symptoms: value,
            status: { ...prev.status, symptoms: value.trim() ? 'edited' : 'empty' },
          }))
        }
      />

      <FieldEditor
        label="诊断结果"
        value={localDraft.diagnosis}
        status={localDraft.status.diagnosis}
        rows={2}
        candidates={diagnosisCandidates}
        readOnly={readOnly}
        onPickCandidate={(value) =>
          setLocalDraft((prev) => ({
            ...prev,
            diagnosis: value,
            status: { ...prev.status, diagnosis: 'confirmed' },
          }))
        }
        onChange={(value) =>
          setLocalDraft((prev) => ({
            ...prev,
            diagnosis: value,
            status: { ...prev.status, diagnosis: value.trim() ? 'edited' : 'empty' },
          }))
        }
      />

      <FieldEditor
        label="方剂名"
        value={localDraft.formulaName}
        status={localDraft.status.formulaName}
        rows={1}
        candidates={formulaCandidates}
        readOnly={readOnly}
        onPickCandidate={(value) =>
          setLocalDraft((prev) => ({
            ...prev,
            formulaName: value,
            status: { ...prev.status, formulaName: 'confirmed' },
          }))
        }
        onChange={(value) =>
          setLocalDraft((prev) => ({
            ...prev,
            formulaName: value,
            status: { ...prev.status, formulaName: value.trim() ? 'edited' : 'empty' },
          }))
        }
      />

      <FieldEditor
        label="方剂详情"
        value={localDraft.formulaDetail}
        status={localDraft.status.formulaDetail}
        rows={3}
        readOnly={readOnly}
        onChange={(value) =>
          setLocalDraft((prev) => ({
            ...prev,
            formulaDetail: value,
            status: { ...prev.status, formulaDetail: value.trim() ? 'edited' : 'empty' },
          }))
        }
      />

      <FieldEditor
        label="用法用量"
        value={localDraft.usageNote}
        status={localDraft.status.usageNote}
        rows={2}
        readOnly={readOnly}
        onChange={(value) =>
          setLocalDraft((prev) => ({
            ...prev,
            usageNote: value,
            status: { ...prev.status, usageNote: value.trim() ? 'edited' : 'empty' },
          }))
        }
      />

      <FieldEditor
        label="备注"
        value={localDraft.note}
        status={localDraft.status.note}
        rows={2}
        readOnly={readOnly}
        hideStatus
        onChange={(value) =>
          setLocalDraft((prev) => ({
            ...prev,
            note: value,
            status: { ...prev.status, note: value.trim() ? 'edited' : 'empty' },
          }))
        }
      />
      </div>

      {!readOnly ? (
        <div className="mt-3 space-y-2">
          <button
            type="button"
            disabled={!consultationId || saving}
            onClick={() => void onSaveDraft(localDraft)}
            className="w-full rounded-xl border border-primary-200 px-3 py-2 text-sm font-semibold text-primary-700 transition hover:bg-primary-50 disabled:opacity-60"
          >
            保存草稿
          </button>
          <button
            type="button"
            disabled={!consultationId || writing}
            onClick={() => {
              setConfirmError(null)
              setConfirmOpen(true)
            }}
            className="w-full rounded-xl bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-soft-card transition hover:bg-primary-700 disabled:opacity-60"
          >
            写入病例
          </button>
        </div>
      ) : null}

      <WriteCaseConfirmModal
        open={confirmOpen}
        draft={localDraft}
        patients={patients}
        error={confirmError}
        pending={writing || saving}
        onClose={() => setConfirmOpen(false)}
        onChange={(next) => setLocalDraft(next)}
        onConfirm={async () => {
          if (!localDraft.patientId) {
            setConfirmError('写入病例前必须先关联患者。')
            return
          }
          setConfirmError(null)
          await onSaveDraft(localDraft)
          await onWriteCase(localDraft)
          setConfirmOpen(false)
        }}
      />
    </div>
  )
}

function statusPill(status: ConsultationDraft['status'][keyof ConsultationDraft['status']]) {
  if (status === 'confirmed') return 'bg-emerald-50 text-emerald-700'
  if (status === 'suggested') return 'bg-blue-50 text-blue-700'
  if (status === 'edited') return 'bg-violet-50 text-violet-700'
  return 'bg-slate-100 text-slate-700'
}

function FieldEditor({
  label,
  value,
  status,
  onChange,
  rows,
  candidates,
  onPickCandidate,
  readOnly,
  hideStatus,
}: {
  label: string
  value: string
  status: ConsultationDraft['status'][keyof ConsultationDraft['status']]
  onChange: (value: string) => void
  rows: number
  candidates?: string[]
  onPickCandidate?: (value: string) => void
  readOnly?: boolean
  hideStatus?: boolean
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-600">{label}</span>
        {hideStatus || status === 'empty' ? null : (
          <span className={`pill text-xs font-semibold ${statusPill(status)}`}>
            {status === 'suggested' ? '待确认' : status === 'confirmed' ? '已确认' : '已修改'}
          </span>
        )}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        readOnly={Boolean(readOnly)}
        rows={rows}
        className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 read-only:bg-slate-50 read-only:text-slate-600"
      />
      {!readOnly && candidates && candidates.length > 0 && onPickCandidate ? (
        <div className="flex flex-wrap gap-2">
          {candidates.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onPickCandidate(c)}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              {c}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function WriteCaseConfirmModal({
  open,
  draft,
  patients,
  error,
  pending,
  onClose,
  onChange,
  onConfirm,
}: {
  open: boolean
  draft: ConsultationDraft
  patients: Patient[]
  error: string | null
  pending: boolean
  onClose: () => void
  onChange: (draft: ConsultationDraft) => void
  onConfirm: () => Promise<void> | void
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <button type="button" onClick={onClose} className="absolute inset-0 bg-black/30" aria-label="关闭确认弹窗" />
      <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-ink">确认写入病例</p>
            <p className="text-xs text-slate-500">写入前可修改字段，写入后仍允许在病例详情中编辑。</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            关闭
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-5">
          <div className="grid grid-cols-2 gap-4">
            <label className="col-span-2 space-y-2">
              <span className="text-xs font-semibold text-slate-600">关联患者（必填）</span>
              <select
                value={draft.patientId ?? ''}
                onChange={(e) =>
                  onChange({
                    ...draft,
                    patientId: e.target.value || undefined,
                    status: { ...draft.status, patientId: e.target.value ? 'confirmed' : 'empty' },
                  })
                }
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              >
                <option value="">未关联</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}（{p.id}）
                  </option>
                ))}
              </select>
            </label>

            <label className="col-span-2 space-y-2">
              <span className="text-xs font-semibold text-slate-600">症状</span>
              <textarea
                value={draft.symptoms}
                onChange={(e) => onChange({ ...draft, symptoms: e.target.value })}
                rows={2}
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              />
            </label>

            <label className="col-span-2 space-y-2">
              <span className="text-xs font-semibold text-slate-600">诊断结果</span>
              <textarea
                value={draft.diagnosis}
                onChange={(e) => onChange({ ...draft, diagnosis: e.target.value })}
                rows={2}
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              />
            </label>

            <label className="col-span-2 space-y-2">
              <span className="text-xs font-semibold text-slate-600">治疗方剂名</span>
              <input
                value={draft.formulaName}
                onChange={(e) => onChange({ ...draft, formulaName: e.target.value })}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              />
            </label>

            <label className="col-span-2 space-y-2">
              <span className="text-xs font-semibold text-slate-600">治疗方剂详情</span>
              <textarea
                value={draft.formulaDetail}
                onChange={(e) => onChange({ ...draft, formulaDetail: e.target.value })}
                rows={4}
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              />
            </label>

            <label className="col-span-2 space-y-2">
              <span className="text-xs font-semibold text-slate-600">用法用量</span>
              <textarea
                value={draft.usageNote}
                onChange={(e) => onChange({ ...draft, usageNote: e.target.value })}
                rows={2}
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              />
            </label>

            <label className="col-span-2 space-y-2">
              <span className="text-xs font-semibold text-slate-600">备注</span>
              <textarea
                value={draft.note}
                onChange={(e) => onChange({ ...draft, note: e.target.value })}
                rows={2}
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              />
            </label>
          </div>

          {error ? (
            <div className="mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            取消
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => void onConfirm()}
            className="h-10 rounded-xl bg-primary-600 px-4 text-sm font-semibold text-white shadow-soft-card transition hover:bg-primary-700 disabled:opacity-60"
          >
            确认写入
          </button>
        </div>
      </div>
    </div>
  )
}
