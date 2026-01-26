import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ConsultationDraft, Patient } from '../types'
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
  suggestedSymptoms = [],
  saving,
  readOnly = false,
  onCreatePatient,
  onSaveDraft,
  onDraftChange,
}: {
  consultationId: string
  draft: ConsultationDraft
  patients: Patient[]
  suggestedSymptoms?: string[]
  saving: boolean
  readOnly?: boolean
  onCreatePatient: (input: PatientCreateInput) => Promise<Patient>
  onSaveDraft: (draft: ConsultationDraft) => Promise<void> | void
  onDraftChange?: (draft: ConsultationDraft) => void
}) {
  const [localDraft, setLocalDraft] = useState<ConsultationDraft>(() => draft)
  const [patientPickerOpen, setPatientPickerOpen] = useState(false)
  const [patientQuery, setPatientQuery] = useState('')
  const [createPatientOpen, setCreatePatientOpen] = useState(false)
  const [saveNotice, setSaveNotice] = useState<{ tone: 'success' | 'error'; message: string } | null>(null)

  const updateLocalDraft = useCallback(
    (updater: (prev: ConsultationDraft) => ConsultationDraft) => {
      setLocalDraft((prev) => {
        const next = updater(prev)
        if (next !== prev) {
          onDraftChange?.(next)
        }
        return next
      })
    },
    [onDraftChange],
  )

  useEffect(() => {
    setLocalDraft(draft)
  }, [draft.consultationId, draft.updatedAt])

  useEffect(() => {
    if (readOnly) return
    if (!Array.isArray(suggestedSymptoms) || suggestedSymptoms.length === 0) return
    const merged = mergeSymptoms(localDraft.symptoms, suggestedSymptoms)
    if (merged === localDraft.symptoms) return
    setLocalDraft((prev) => {
      if (prev.symptoms === merged) return prev
      const next = {
        ...prev,
        symptoms: merged,
        status: { ...prev.status, symptoms: 'suggested' },
      }
      onDraftChange?.(next)
      return next
    })
  }, [localDraft.symptoms, onDraftChange, readOnly, suggestedSymptoms])

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

          <div className="relative">
            <button
              type="button"
              onClick={() => setPatientPickerOpen((p) => !p)}
              disabled={readOnly}
              className="flex h-10 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 transition hover:bg-slate-50 disabled:bg-slate-50 disabled:text-slate-500"
            >
              <span className="truncate">
                {selectedPatient
                  ? `${selectedPatient.name}${getPatientAge(selectedPatient) ? `（${getPatientAge(selectedPatient)}岁）` : ''}`
                  : '选择/新建患者'}
              </span>
              <span className="whitespace-nowrap text-xs text-slate-400">{patientPickerOpen ? '收起' : '展开'}</span>
            </button>

            {patientPickerOpen && !readOnly ? (
              <div className="absolute left-0 right-0 top-full z-20 mt-2 rounded-2xl border border-slate-100 bg-white/90 p-3 shadow-soft-card">
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
                  <div className="max-h-56 overflow-y-auto">
                    {filteredPatients.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          updateLocalDraft((prev) => ({
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
          </div>

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
              onDraftChange?.(next)
              setPatientPickerOpen(false)
              await onSaveDraft(next)
            }}
          />
        </div>

        <FieldEditor
          label="症状"
          value={localDraft.symptoms}
          status={localDraft.status.symptoms}
          rows={3}
          readOnly={readOnly}
          hideStatus
          onChange={(value) =>
            updateLocalDraft((prev) => ({
              ...prev,
              symptoms: value,
              status: { ...prev.status, symptoms: value.trim() ? 'edited' : 'empty' },
            }))
          }
        />

        <FieldEditor
          label="病症"
          value={localDraft.diagnosis}
          status={localDraft.status.diagnosis}
          rows={3}
          readOnly={readOnly}
          onPickCandidate={(value) =>
            updateLocalDraft((prev) => ({
              ...prev,
              diagnosis: value,
              status: { ...prev.status, diagnosis: 'confirmed' },
            }))
          }
          onChange={(value) =>
            updateLocalDraft((prev) => ({
              ...prev,
              diagnosis: value,
              status: { ...prev.status, diagnosis: value.trim() ? 'edited' : 'empty' },
            }))
          }
        />

        <FieldEditor
          label="方剂"
          value={localDraft.formulaName}
          status={localDraft.status.formulaName}
          rows={3}
          readOnly={readOnly}
          onPickCandidate={(value) =>
            updateLocalDraft((prev) => ({
              ...prev,
              formulaName: value,
              status: { ...prev.status, formulaName: 'confirmed' },
            }))
          }
          onChange={(value) =>
            updateLocalDraft((prev) => ({
              ...prev,
              formulaName: value,
              status: { ...prev.status, formulaName: value.trim() ? 'edited' : 'empty' },
            }))
          }
        />

        <FieldEditor
          label="备注"
          value={localDraft.note}
          status={localDraft.status.note}
          rows={3}
          readOnly={readOnly}
          hideStatus
          onChange={(value) =>
            updateLocalDraft((prev) => ({
              ...prev,
              note: value,
              status: { ...prev.status, note: value.trim() ? 'edited' : 'empty' },
            }))
          }
        />
      </div>

      {!readOnly ? (
        <div className="relative mt-3 space-y-2">
          {saveNotice ? (
            <div className="pointer-events-none absolute -top-7 left-0 right-0 flex justify-center">
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  saveNotice.tone === 'success'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-rose-50 text-rose-600'
                }`}
              >
                {saveNotice.message}
              </span>
            </div>
          ) : null}
          <button
            type="button"
            disabled={!consultationId || saving}
            onClick={async () => {
              setSaveNotice(null)
              try {
                await onSaveDraft(localDraft)
                setSaveNotice({ tone: 'success', message: '保存成功。' })
              } catch (error) {
                setSaveNotice({
                  tone: 'error',
                  message: error instanceof Error ? error.message : '保存失败。',
                })
              }
              window.setTimeout(() => setSaveNotice(null), 2000)
            }}
            className="w-full rounded-xl bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-soft-card transition hover:bg-primary-700 disabled:opacity-60"
          >
            保存
          </button>
        </div>
      ) : null}
    </div>
  )
}

function statusPill(status: ConsultationDraft['status'][keyof ConsultationDraft['status']]) {
  if (status === 'confirmed') return 'bg-emerald-50 text-emerald-700'
  if (status === 'suggested') return 'bg-blue-50 text-blue-700'
  if (status === 'edited') return 'bg-violet-50 text-violet-700'
  return 'bg-slate-100 text-slate-700'
}

function mergeSymptoms(current: string, incoming: string[]) {
  const currentList = splitSymptoms(current)
  const normalized = new Set(currentList)
  incoming.forEach((item) => {
    const trimmed = item.trim()
    if (!trimmed) return
    normalized.add(trimmed)
  })
  return Array.from(normalized).join('、')
}

function splitSymptoms(value: string) {
  if (!value.trim()) return []
  return value
    .split(/[、,，\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
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
        {hideStatus || status === 'empty' || status === 'edited' ? null : (
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
