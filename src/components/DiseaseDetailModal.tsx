import { createPortal } from 'react-dom'
import type { Disease } from '../types'

export function DiseaseDetailModal({
  open,
  disease,
  onClose,
  onConfirm,
}: {
  open: boolean
  disease?: Disease
  onClose: () => void
  onConfirm?: () => void
}) {
  if (!open) return null
  if (typeof document === 'undefined') return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
      <button type="button" onClick={onClose} className="absolute inset-0 bg-black/30" aria-label="关闭病症详情" />
      <div className="relative flex h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <p className="text-sm font-semibold text-ink">{disease?.name ?? '病症详情'}</p>
          <div className="flex items-center gap-2">
            {onConfirm ? (
              <button
                type="button"
                onClick={onConfirm}
                className="rounded-xl bg-primary-600 px-3 py-1.5 text-sm font-semibold text-white shadow-soft-card transition hover:bg-primary-700"
              >
                采纳
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              关闭
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto bg-slate-50 p-5">
          {!disease ? (
            <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm text-slate-600">
              未找到对应病症详情。
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <InfoColumn label="类型" value={resolveTypeLabel(disease.typeCode)} />
                <InfoColumn label="类型名称" value={disease.typeName} />
                <InfoColumn label="名称" value={disease.name} />
              </div>
              <DetailBlock label="症状描述" value={disease.symptoms} />
              <DetailBlock label="鉴别方法" value={disease.differentiation} />
              <DetailBlock label="方剂" value={disease.formula} />
              <DetailBlock label="备注" value={disease.note ?? ''} />
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}

function InfoColumn({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm text-slate-700">
      <span className="text-xs font-semibold text-slate-500">{label}</span>
      <p className="mt-2 text-sm text-slate-700">{value || '—'}</p>
    </div>
  )
}

function DetailBlock({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{value || '—'}</p>
    </div>
  )
}

function resolveTypeLabel(typeCode?: string) {
  if (typeCode === '1' || typeCode === 'disease') return '疾病'
  if (typeCode === '2' || typeCode === 'syndrome') return '症候'
  if (typeCode === '3' || typeCode === 'symptom') return '症状'
  return typeCode ?? '—'
}
