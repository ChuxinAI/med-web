import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCreateDisease, useDeleteDisease, useDiseases, useImportDiseases, useUpdateDisease } from '../../api/queries'
import { Card } from '../../components/Card'
import { CreatedAtSortToggle } from '../../components/CreatedAtSortToggle'
import { DiseaseEditModal } from '../../components/DiseaseEditModal'
import { InlineNotice } from '../../components/InlineNotice'
import { TablePagination } from '../../components/TablePagination'
import type { Disease } from '../../types'

export function CatalogPage() {
  const { data: diseases } = useDiseases()
  const createDisease = useCreateDisease()
  const updateDisease = useUpdateDisease()
  const deleteDisease = useDeleteDisease()
  const importDiseases = useImportDiseases()

  const [q, setQ] = useState('')
  const [order, setOrder] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<Disease | null>(null)
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; message: string } | null>(null)
  const [importDetails, setImportDetails] = useState<Record<string, unknown>[] | null>(null)
  const [importing, setImporting] = useState(false)
  const [category, setCategory] = useState('')
  const fileInputId = 'disease-batch-import'

  const formatSkippedRow = (row: Record<string, unknown>) => {
    const keyMap: Record<string, string> = {
      name: '病症名',
      disease: '病症名',
      disease_name: '病症名',
      type_name: '类型名称',
      typename: '类型名称',
      type_code: '类型编码',
      type: '类型',
      symptoms: '症状描述',
      symptom: '症状描述',
      differentiation: '鉴别方法',
      formula: '方剂',
      note: '备注',
      notes: '备注',
      reason: '原因',
      error: '错误',
      row: '行号',
      row_number: '行号',
      row_index: '行号',
      line: '行号',
    }
    return Object.entries(row).map(([key, value]) => {
      const label = keyMap[key] ?? key
      const text = value == null ? '' : String(value)
      return `${label}：${text}`
    })
  }

  const categoryOptions = [
    { value: 'disease', label: '疾病' },
    { value: 'syndrome', label: '症候' },
    { value: 'symptom', label: '症状' },
  ]
  const typeLabelMap = useMemo<Record<string, string>>(() => {
    const base = categoryOptions.reduce<Record<string, string>>((acc, item) => {
      acc[item.value] = item.label
      return acc
    }, {})
    return {
      ...base,
      '1': '疾病',
      '2': '症候',
      '3': '症状',
    }
  }, [])
  const getTypeLabel = (value: string) => typeLabelMap[value] ?? value

  const filtered = useMemo(() => {
    const keyword = q.trim()
    return (diseases ?? [])
      .filter((item) => {
        if (category && item.typeCode !== category) return false
        if (!keyword) return true
        return [
          item.id,
          item.name,
          item.typeName,
          item.typeCode,
          item.symptoms,
          item.differentiation,
          item.formula,
          item.note,
        ]
          .filter(Boolean)
          .join(' ')
          .includes(keyword)
      })
      .sort((a, b) => {
        const dir = order === 'asc' ? 1 : -1
        return (a.createdAt > b.createdAt ? 1 : -1) * dir
      })
  }, [diseases, order, q])

  const total = filtered.length
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, pageCount)
  const pageItems = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, (safePage - 1) * pageSize + pageSize),
    [filtered, pageSize, safePage],
  )

  return (
    <>
      <Card
        title="病症管理"
        action={
          <div className="flex flex-wrap items-center gap-2">
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setPage(1)
            }}
            placeholder="检索：名称/类型/症状/鉴别/方剂/备注/ID"
            className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 sm:w-72"
          />
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value)
              setPage(1)
            }}
            className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 sm:w-40"
          >
            <option value="">全部类别</option>
            {categoryOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <CreatedAtSortToggle
            order={order}
            onToggle={() => {
              setOrder((p) => (p === 'asc' ? 'desc' : 'asc'))
              setPage(1)
            }}
          />
          <input
            id={fileInputId}
            type="file"
            accept=".xlsx,.xls"
            disabled={importing}
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file) return
              setNotice(null)
              setImporting(true)
              try {
                const result = await importDiseases.mutateAsync({ file })
                setNotice({
                  tone: 'success',
                  message: `已导入 ${result.imported} 条，跳过 ${result.skipped} 条。`,
                })
                setImportDetails(result.skippedRows.length > 0 ? result.skippedRows : null)
              } catch (error) {
                setNotice({
                  tone: 'error',
                  message: error instanceof Error ? error.message : '导入失败',
                })
                setImportDetails(null)
              } finally {
                setImporting(false)
                e.currentTarget.value = ''
              }
            }}
          />
          <button
            type="button"
            onClick={() => {
              setNotice(null)
              setCreateOpen(true)
            }}
            className="inline-flex h-9 w-full items-center justify-center rounded-xl bg-emerald-600 px-3 text-sm font-semibold text-white shadow-soft-card transition hover:bg-emerald-700 sm:w-auto"
          >
            新增病症
          </button>
          <label
            htmlFor={fileInputId}
            className={`inline-flex h-9 w-full items-center justify-center rounded-xl bg-emerald-600 px-3 text-sm font-semibold text-white shadow-soft-card transition hover:bg-emerald-700 sm:w-auto ${
              importing ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
            }`}
          >
            批量导入
          </label>
          <a href="/example.xlsx" download className="text-xs text-slate-500 hover:text-slate-700">
            下载示例
          </a>
        </div>
      }
    >
      <div className="rounded-2xl border border-slate-100 bg-white/70 lg:hidden">
        <div className="divide-y divide-slate-100">
          {pageItems.map((item) => (
            <div key={item.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-ink">{item.name}</div>
                  <div className="mt-1 text-xs text-slate-500">{item.id}</div>
                  <div className="mt-2 text-sm text-slate-700">
                    <span className="text-xs font-semibold text-slate-500">类型</span>
                    <div className="mt-1 line-clamp-2">
                      {[item.typeName, getTypeLabel(item.typeCode)].filter(Boolean).join(' / ') || '—'}
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-slate-700">
                    <span className="text-xs font-semibold text-slate-500">症状描述</span>
                    <div className="mt-1 line-clamp-2">{item.symptoms || '—'}</div>
                  </div>
                  <div className="mt-2 text-sm text-slate-700">
                    <span className="text-xs font-semibold text-slate-500">鉴别方法</span>
                    <div className="mt-1 line-clamp-2">{item.differentiation || '—'}</div>
                  </div>
                  <div className="mt-2 text-sm text-slate-700">
                    <span className="text-xs font-semibold text-slate-500">方剂</span>
                    <div className="mt-1 line-clamp-2">{item.formula || '—'}</div>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setNotice(null)
                    setEditing(item)
                  }}
                  className="inline-flex h-9 items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-soft-card hover:bg-emerald-700"
                >
                  编辑
                </button>
                <Link
                  to={`/admin/stats/consultations?disease=${encodeURIComponent(item.name)}`}
                  className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  查看问诊
                </Link>
                <button
                  type="button"
                  onClick={async () => {
                    const ok = window.confirm(`确认删除病症“${item.name}”？`)
                    if (!ok) return
                    try {
                      await deleteDisease.mutateAsync({ diseaseId: item.id })
                      setNotice({ tone: 'success', message: '病症已删除。' })
                    } catch (error) {
                      setNotice({
                        tone: 'error',
                        message: error instanceof Error ? error.message : '删除失败',
                      })
                    }
                  }}
                  className="inline-flex h-9 items-center justify-center rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white shadow-soft-card hover:bg-rose-700"
                >
                  删除
                </button>
              </div>
            </div>
          ))}
          {pageItems.length === 0 ? (
            <div className="px-4 py-10 text-center text-slate-500">无匹配记录</div>
          ) : null}
        </div>
      </div>

      <div className="hidden lg:block">
        <div className="rounded-2xl border border-slate-100 bg-white/70">
          <table className="w-full table-fixed text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="w-[10%] px-4 py-3">ID</th>
                <th className="w-[15%] px-4 py-3">类型</th>
                <th className="w-[25%] px-4 py-3">类型名称</th>
                <th className="w-[30%] px-4 py-3">名称</th>
                <th className="w-[20%] px-4 py-3 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pageItems.map((item) => (
                <tr key={item.id} className="hover:bg-white/50">
                  <td className="truncate px-4 py-3 text-ink" title={item.id}>
                    {item.id}
                  </td>
                  <td className="truncate px-4 py-3 text-slate-700" title={item.typeCode}>
                    {getTypeLabel(item.typeCode) || '-'}
                  </td>
                  <td className="truncate px-4 py-3 text-slate-700" title={item.typeName}>
                    {item.typeName || '-'}
                  </td>
                  <td className="truncate px-4 py-3 text-slate-700" title={item.name}>
                    {item.name}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setNotice(null)
                          setEditing(item)
                        }}
                        className="inline-flex h-8 items-center justify-center rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white shadow-soft-card hover:bg-emerald-700"
                      >
                        编辑
                      </button>
                      <Link
                        to={`/admin/stats/consultations?disease=${encodeURIComponent(item.name)}`}
                        className="inline-flex h-8 items-center justify-center rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white shadow-soft-card hover:bg-emerald-700"
                      >
                        查看问诊
                      </Link>
                      <button
                        type="button"
                        onClick={async () => {
                          const ok = window.confirm(`确认删除病症“${item.name}”？`)
                          if (!ok) return
                          try {
                            await deleteDisease.mutateAsync({ diseaseId: item.id })
                            setNotice({ tone: 'success', message: '病症已删除。' })
                          } catch (error) {
                            setNotice({
                              tone: 'error',
                              message: error instanceof Error ? error.message : '删除失败',
                            })
                          }
                        }}
                        className="inline-flex h-8 items-center justify-center rounded-lg bg-rose-600 px-3 text-xs font-semibold text-white shadow-soft-card hover:bg-rose-700"
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {pageItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                    无匹配记录
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <TablePagination
        page={safePage}
        pageCount={pageCount}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={(next) => {
          setPageSize(next)
          setPage(1)
        }}
      />

      {importDetails ? (
        <div className="mt-3 rounded-2xl border border-slate-100 bg-white/70 p-4 text-xs text-slate-600">
          <p className="font-semibold text-slate-700">跳过明细</p>
          <div className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50 p-3 font-mono text-[11px]">
            {importDetails.map((row, index) => (
              <div key={`${index}-${JSON.stringify(row)}`} className="py-1">
                {formatSkippedRow(row).map((line, lineIndex) => (
                  <div key={`${index}-${lineIndex}`}>{line}</div>
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <DiseaseEditModal
        open={createOpen}
        mode="create"
        onClose={() => setCreateOpen(false)}
        onSave={async (input) => {
          await createDisease.mutateAsync(input)
          setNotice({ tone: 'success', message: '病症已新增。' })
        }}
      />

      <DiseaseEditModal
        open={Boolean(editing)}
        mode="edit"
        disease={editing}
        onClose={() => setEditing(null)}
        onSave={async (input) => {
          if (!editing) return
          await updateDisease.mutateAsync({ diseaseId: editing.id, patch: input })
          setNotice({ tone: 'success', message: '病症已更新。' })
        }}
      />
      </Card>

      {notice ? (
        <div className="mt-4">
          <InlineNotice tone={notice.tone} message={notice.message} />
        </div>
      ) : null}
    </>
  )
}
