import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMedicalCases } from '../../api/queries'
import { Badge } from '../../components/Badge'
import { Card } from '../../components/Card'
import { ConsultationWorkspaceModal } from '../../components/ConsultationWorkspaceModal'
import { CreatedAtSortToggle } from '../../components/CreatedAtSortToggle'
import { TablePagination } from '../../components/TablePagination'
import { formatDateTime } from '../../lib/datetime'

export function CasesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const patientIdFilter = searchParams.get('patientId')
  const { data: cases } = useMedicalCases()
  const [q, setQ] = useState('')
  const [order, setOrder] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [openConsultationId, setOpenConsultationId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const keyword = q.trim()
    return (cases ?? [])
      .filter((item) => (patientIdFilter ? item.patientId === patientIdFilter : true))
      .filter((item) => {
        if (!keyword) return true
        const haystack = [item.id, item.patientName, item.diagnosis, item.formulaName].join(' ')
        return haystack.includes(keyword)
      })
      .sort((a, b) => {
        const dir = order === 'asc' ? 1 : -1
        return (a.createdAt > b.createdAt ? 1 : -1) * dir
      })
  }, [cases, order, patientIdFilter, q])

  const filteredPatientName = useMemo(() => {
    if (!patientIdFilter) return null
    const matched = (cases ?? []).find((c) => c.patientId === patientIdFilter)
    return matched?.patientName ?? patientIdFilter
  }, [cases, patientIdFilter])

  const total = filtered.length
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, pageCount)
  const pageItems = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, (safePage - 1) * pageSize + pageSize),
    [filtered, pageSize, safePage],
  )

  return (
    <Card
      title="病例管理"
      action={
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setPage(1)
            }}
            placeholder="检索：患者/诊断/方剂/ID"
            className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 sm:w-60"
          />
          {patientIdFilter ? (
            <button
              type="button"
              onClick={() => {
                setSearchParams((prev) => {
                  const next = new URLSearchParams(prev)
                  next.delete('patientId')
                  return next
                })
              }}
              className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              title="清除患者筛选"
            >
              患者：{filteredPatientName ?? patientIdFilter} ×
            </button>
          ) : null}
          <CreatedAtSortToggle
            order={order}
            onToggle={() => {
              setOrder((p) => (p === 'asc' ? 'desc' : 'asc'))
              setPage(1)
            }}
          />
        </div>
      }
    >
      <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white/70">
        <table className="w-full min-w-[900px] table-fixed text-left text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              <th className="w-36 px-4 py-3">病例ID</th>
              <th className="w-28 px-4 py-3">患者</th>
              <th className="px-4 py-3">诊断结果</th>
              <th className="w-48 px-4 py-3">治疗方剂名</th>
              <th className="w-52 px-4 py-3">更新时间</th>
              <th className="w-44 px-4 py-3 text-center">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pageItems.map((item) => (
              <tr key={item.id} className="hover:bg-white/50">
                <td className="px-4 py-3">
                  <Link to={`/doctor/cases/${item.id}`} className="font-semibold text-ink hover:underline">
                    {item.id}
                  </Link>
                </td>
                <td className="px-4 py-3 font-semibold text-ink">{item.patientName}</td>
                <td className="truncate px-4 py-3 text-slate-700">{item.diagnosis}</td>
                <td className="px-4 py-3">
                  <Badge tone="success">{item.formulaName}</Badge>
                </td>
                <td className="px-4 py-3 text-slate-700">{formatDateTime(item.updatedAt)}</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Link
                      to={`/doctor/cases/${item.id}`}
                      className="inline-flex h-8 items-center justify-center rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white shadow-soft-card hover:bg-emerald-700"
                    >
                      编辑
                    </Link>
                    {item.consultationId ? (
                      <button
                        type="button"
                        onClick={() => setOpenConsultationId(item.consultationId ?? null)}
                        className="inline-flex h-8 items-center justify-center rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white shadow-soft-card hover:bg-emerald-700"
                      >
                        查看问诊
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
            {pageItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                  无匹配记录
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
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

      <ConsultationWorkspaceModal
        open={Boolean(openConsultationId)}
        consultationId={openConsultationId}
        readOnly={false}
        onClose={() => setOpenConsultationId(null)}
      />
    </Card>
  )
}
