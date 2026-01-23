import { useMemo } from 'react'
import { useDiseases } from '../api/queries'
import type { Citation } from '../types'

export function SourcePreviewModal({
  open,
  citation,
  onClose,
}: {
  open: boolean
  citation: Citation | null
  onClose: () => void
}) {
  if (!open || !citation) return null

  const { data: diseases } = useDiseases()
  const disease = useMemo(() => {
    if (!diseases) return undefined
    if (citation.diseaseId) {
      return diseases.find((item) => item.id === citation.diseaseId)
    }
    if (citation.diseaseName) {
      return diseases.find((item) => item.name === citation.diseaseName)
    }
    return undefined
  }, [citation.diseaseId, citation.diseaseName, diseases])

  const title = citation.diseaseName ?? disease?.name ?? citation.fileName ?? '病症详情'
  const typeLabelMap: Record<string, string> = {
    disease: '疾病',
    syndrome: '症候',
    symptom: '症状',
  }
  const typeLabel = disease?.typeCode ? typeLabelMap[disease.typeCode] ?? disease.typeCode : '—'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/30"
        aria-label="关闭预览"
      />
      <div className="relative flex w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <div>
            <p className="text-sm font-semibold text-ink">{title}</p>
            <p className="text-xs text-slate-500">来源：病症管理信息</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            关闭
          </button>
        </div>
        <div className="bg-slate-50 p-5">
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-ink">{disease?.name ?? citation.diseaseName ?? '未找到病症'}</p>
              {disease?.id ? (
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                  {disease.id}
                </span>
              ) : null}
            </div>
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              <div>
                <p className="text-xs font-semibold text-slate-500">类型名称</p>
                <p className="mt-1">{disease?.typeName ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">类型</p>
                <p className="mt-1">{typeLabel}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">症状描述</p>
                <p className="mt-1">{disease?.symptoms ?? '暂无描述'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">鉴别方法</p>
                <p className="mt-1">{disease?.differentiation ?? '暂无描述'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">方剂</p>
                <p className="mt-1">{disease?.formula ?? '暂无描述'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">备注</p>
                <p className="mt-1">{disease?.note ?? '—'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
