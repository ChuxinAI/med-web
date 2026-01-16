import { useMemo, useState } from 'react'
import { useDoctorCases } from '../../api/queries'
import { Card } from '../../components/Card'
import { ConsultationWorkspaceModal } from '../../components/ConsultationWorkspaceModal'
import { CreatedAtSortToggle } from '../../components/CreatedAtSortToggle'
import { TablePagination } from '../../components/TablePagination'
import { formatDateTime } from '../../lib/datetime'

export function AdminConsultationsStatsPage() {
  const { data: consultations } = useDoctorCases()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<'all' | 'open' | 'in_review' | 'closed'>('all')
  const [openConsultationId, setOpenConsultationId] = useState<string | null>(null)
  const [order, setOrder] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const filtered = useMemo(() => {
    const keyword = q.trim()
    return (consultations ?? [])
      .filter((c) => (status === 'all' ? true : c.status === status))
      .filter((c) => {
        if (!keyword) return true
        return [c.id, c.patientName, c.doctorName, c.symptomsText, c.diagnosisText].filter(Boolean).join(' ').includes(keyword)
      })
      .sort((a, b) => {
        const dir = order === 'asc' ? 1 : -1
        return (a.createdAt > b.createdAt ? 1 : -1) * dir
      })
  }, [consultations, order, q, status])

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
        title="问诊管理"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value)
                setPage(1)
              }}
              placeholder="检索：医生/患者/症状/诊断/ID"
              className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 sm:w-72"
            />
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as typeof status)
                setPage(1)
              }}
              className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 sm:w-auto"
            >
              <option value="all">全部状态</option>
              <option value="open">open</option>
              <option value="in_review">in_review</option>
              <option value="closed">closed</option>
            </select>
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
          <table className="w-full min-w-[1040px] table-fixed text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="w-[16%] px-4 py-3">问诊ID</th>
                <th className="w-[12%] px-4 py-3">医生</th>
                <th className="w-[12%] px-4 py-3">患者</th>
                <th className="w-[25%] px-4 py-3">症状</th>
                <th className="w-[25%] px-4 py-3">诊断结果</th>
                <th className="w-[14%] px-4 py-3">更新时间</th>
                <th className="w-[12%] px-4 py-3 text-center">对话</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pageItems.map((c) => (
                <tr key={c.id} className="hover:bg-white/50">
                  <td className="px-4 py-3 font-semibold text-ink">{c.id}</td>
                  <td className="px-4 py-3 text-slate-700">{c.doctorName}</td>
                  <td className="px-4 py-3 text-slate-700">{c.patientName}</td>
                  <td className="truncate px-4 py-3 text-slate-700" title={c.symptomsText ?? ''}>
                    {c.symptomsText ?? '-'}
                  </td>
                  <td className="truncate px-4 py-3 text-slate-700" title={c.diagnosisText ?? ''}>
                    {c.diagnosisText ?? '-'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-700">{formatDateTime(c.updatedAt)}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => setOpenConsultationId(c.id)}
                      className="inline-flex h-8 items-center justify-center rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white shadow-soft-card hover:bg-emerald-700"
                    >
                      查看
                    </button>
                  </td>
                </tr>
              ))}
              {pageItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
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
      </Card>

      <ConsultationWorkspaceModal
        open={Boolean(openConsultationId)}
        consultationId={openConsultationId}
        readOnly
        onClose={() => setOpenConsultationId(null)}
      />
    </>
  )
}
