import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useMedicalCaseDetails, useUpdateMedicalCase } from '../api/queries'
import type { MedicalCaseDetails } from '../types'
import { InlineNotice } from './InlineNotice'

export function MedicalCaseEditModal({
  open,
  caseId,
  onClose,
}: {
  open: boolean
  caseId: string | null
  onClose: () => void
}) {
  const { data: detail } = useMedicalCaseDetails(caseId ?? undefined)

  if (!open || !caseId) return null
  if (typeof document === 'undefined') return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-6">
      <button type="button" onClick={onClose} className="absolute inset-0 bg-black/30" aria-label="关闭编辑病例" />
      <div className="relative my-10 w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">编辑病例</p>
            <p className="truncate text-xs text-slate-500">{detail ? `${detail.patientName}（${detail.id}）` : caseId}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            关闭
          </button>
        </div>

        {!detail ? (
          <div className="p-5 text-sm text-slate-600">正在加载...</div>
        ) : (
          <MedicalCaseEditForm key={detail.updatedAt} detail={detail} onClose={onClose} />
        )}
      </div>
    </div>,
    document.body,
  )
}

function MedicalCaseEditForm({
  detail,
  onClose,
}: {
  detail: MedicalCaseDetails
  onClose: () => void
}) {
  const updateCase = useUpdateMedicalCase()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [editing, setEditing] = useState(() => ({
    symptoms: detail.symptoms ?? '',
    diagnosis: detail.diagnosis ?? '',
    formulaName: detail.formulaName ?? '',
    formulaDetail: detail.formulaDetail ?? '',
    usageNote: detail.usageNote ?? '',
    note: detail.note ?? '',
  }))

  const canSave = useMemo(() => {
    if (updateCase.isPending) return false
    if (!editing.diagnosis.trim() || !editing.formulaName.trim()) return false
    return true
  }, [editing.diagnosis, editing.formulaName, updateCase.isPending])

  const submit = async () => {
    setError(null)
    setSuccess(null)
    try {
      await updateCase.mutateAsync({
        caseId: detail.id,
        patch: {
          symptoms: editing.symptoms.trim(),
          diagnosis: editing.diagnosis.trim(),
          formulaName: editing.formulaName.trim(),
          formulaDetail: editing.formulaDetail.trim(),
          usageNote: editing.usageNote.trim(),
          note: editing.note.trim(),
        },
      })
      setSuccess('保存成功。')
      window.setTimeout(() => onClose(), 300)
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败')
    }
  }

  return (
    <>
      <div className="max-h-[72vh] overflow-y-auto p-5">
        <div className="grid grid-cols-2 gap-4 text-sm text-slate-700">
          <label className="col-span-2 space-y-2">
            <span className="text-xs font-semibold text-slate-600">症状</span>
            <textarea
              value={editing.symptoms}
              onChange={(e) => setEditing((p) => ({ ...p, symptoms: e.target.value }))}
              rows={3}
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
          </label>
          <label className="col-span-2 space-y-2">
            <span className="text-xs font-semibold text-slate-600">诊断结果（必填）</span>
            <textarea
              value={editing.diagnosis}
              onChange={(e) => setEditing((p) => ({ ...p, diagnosis: e.target.value }))}
              rows={2}
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
          </label>
          <label className="col-span-2 space-y-2">
            <span className="text-xs font-semibold text-slate-600">治疗方剂名（必填）</span>
            <input
              value={editing.formulaName}
              onChange={(e) => setEditing((p) => ({ ...p, formulaName: e.target.value }))}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
          </label>
          <label className="col-span-2 space-y-2">
            <span className="text-xs font-semibold text-slate-600">治疗方剂详情</span>
            <textarea
              value={editing.formulaDetail}
              onChange={(e) => setEditing((p) => ({ ...p, formulaDetail: e.target.value }))}
              rows={4}
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
          </label>
          <label className="col-span-2 space-y-2">
            <span className="text-xs font-semibold text-slate-600">用法用量</span>
            <textarea
              value={editing.usageNote}
              onChange={(e) => setEditing((p) => ({ ...p, usageNote: e.target.value }))}
              rows={2}
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
          </label>
          <label className="col-span-2 space-y-2">
            <span className="text-xs font-semibold text-slate-600">备注</span>
            <textarea
              value={editing.note}
              onChange={(e) => setEditing((p) => ({ ...p, note: e.target.value }))}
              rows={2}
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
          </label>
        </div>

        {error ? <InlineNotice tone="error" message={error} /> : null}
        {success ? <InlineNotice tone="success" message={success} /> : null}
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
          disabled={!canSave}
          onClick={() => void submit()}
          className="h-10 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-soft-card hover:bg-emerald-700 disabled:opacity-60"
        >
          {updateCase.isPending ? '保存中...' : '保存'}
        </button>
      </div>
    </>
  )
}
