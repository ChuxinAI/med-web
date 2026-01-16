import { useMemo, useState } from 'react'
import { useDoctorCases } from '../../api/queries'
import { Card } from '../../components/Card'
import { ConsultationWorkspaceModal } from '../../components/ConsultationWorkspaceModal'
import { CreatedAtSortToggle } from '../../components/CreatedAtSortToggle'
import { TablePagination } from '../../components/TablePagination'
import { formatDateTime } from '../../lib/datetime'

export function ConsultationsPage() {
  const { data: cases } = useDoctorCases()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<'all' | 'open' | 'in_review' | 'closed'>('all')
  const [order, setOrder] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [openId, setOpenId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const keyword = q.trim()
    return (cases ?? [])
      .filter((item) => (status === 'all' ? true : item.status === status))
      .filter((item) => {
        if (!keyword) return true
        const haystack = [
          item.id,
          item.patientName,
          item.symptomsText,
          item.diagnosisText,
        ]
          .filter(Boolean)
          .join(' ')
        return haystack.includes(keyword)
      })
      .sort((a, b) => {
        const dir = order === 'asc' ? 1 : -1
        return (a.createdAt > b.createdAt ? 1 : -1) * dir
      })
  }, [cases, order, q, status])

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
        title="问诊记录"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value)
                setPage(1)
              }}
              placeholder="检索：患者/症状/诊断/ID"
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
          <table className="w-full min-w-[980px] table-fixed text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="w-[18%] px-4 py-3">问诊ID</th>
                <th className="w-[14%] px-4 py-3">患者</th>
                <th className="w-[28%] px-4 py-3">症状</th>
                <th className="w-[30%] px-4 py-3">诊断结果</th>
                <th className="w-[14%] px-4 py-3">更新时间</th>
                <th className="w-[10%] px-4 py-3 text-center">对话</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pageItems.map((item) => (
                <tr key={item.id} className="hover:bg-white/50">
                  <td className="px-4 py-3 font-semibold text-ink">
                    {item.id}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-ink">{item.patientName}</div>
                    <div className="text-xs text-slate-500">
                      {item.age} 岁 · {item.gender}
                    </div>
                  </td>
                  <td className="truncate px-4 py-3 text-slate-700" title={item.symptomsText ?? ''}>
                    {item.symptomsText ?? '-'}
                  </td>
                  <td className="truncate px-4 py-3 text-slate-700" title={item.diagnosisText ?? ''}>
                    {item.diagnosisText ?? '-'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-700">{formatDateTime(item.updatedAt)}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => setOpenId(item.id)}
                      className="inline-flex h-8 items-center justify-center rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white shadow-soft-card hover:bg-emerald-700"
                    >
                      查看
                    </button>
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
      </Card>

      <ConsultationWorkspaceModal
        open={Boolean(openId)}
        consultationId={openId}
        readOnly={false}
        onClose={() => setOpenId(null)}
      />
    </>
  )
}
