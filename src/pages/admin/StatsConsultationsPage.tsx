import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useDoctorCases, useDoctorPatients } from '../../api/queries'
import { Card } from '../../components/Card'
import { ConsultationWorkspaceModal } from '../../components/ConsultationWorkspaceModal'
import { CreatedAtSortToggle } from '../../components/CreatedAtSortToggle'
import { TablePagination } from '../../components/TablePagination'
import { formatDateTime } from '../../lib/datetime'
import { HorizontalScroll } from '../../components/HorizontalScroll'

export function AdminConsultationsStatsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const patientIdFilter = searchParams.get('patientId')
  const diseaseFilter = searchParams.get('disease')
  const { data: consultations } = useDoctorCases()
  const { data: patients } = useDoctorPatients()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<'all' | 'open' | 'in_review' | 'closed'>('all')
  const [openConsultationId, setOpenConsultationId] = useState<string | null>(null)
  const [order, setOrder] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const filteredPatientName = useMemo(() => {
    if (!patientIdFilter) return null
    const matched = (patients ?? []).find((p) => p.id === patientIdFilter)
    return matched?.name ?? patientIdFilter
  }, [patientIdFilter, patients])

  const filtered = useMemo(() => {
    const keyword = q.trim()
    return (consultations ?? [])
      .filter((c) => (status === 'all' ? true : c.status === status))
      .filter((c) => {
        if (!patientIdFilter) return true
        if (filteredPatientName && filteredPatientName !== patientIdFilter) {
          return c.patientName === filteredPatientName
        }
        return c.patientName?.includes(patientIdFilter)
      })
      .filter((c) => {
        if (!diseaseFilter) return true
        const haystack = [c.symptomsText, c.diagnosisText].filter(Boolean).join(' ')
        return haystack.includes(diseaseFilter)
      })
      .filter((c) => {
        if (!keyword) return true
        return [c.id, c.patientName, c.doctorName, c.symptomsText, c.diagnosisText].filter(Boolean).join(' ').includes(keyword)
      })
      .sort((a, b) => {
        const dir = order === 'asc' ? 1 : -1
        return (a.createdAt > b.createdAt ? 1 : -1) * dir
      })
  }, [consultations, diseaseFilter, filteredPatientName, order, patientIdFilter, q, status])

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
              placeholder="检索：医生/患者/症状/病症/ID"
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
            {diseaseFilter ? (
              <button
                type="button"
                onClick={() => {
                  setSearchParams((prev) => {
                    const next = new URLSearchParams(prev)
                    next.delete('disease')
                    return next
                  })
                }}
                className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                title="清除病症筛选"
              >
                病症：{diseaseFilter} ×
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
        <div className="rounded-2xl border border-slate-100 bg-white/70 lg:hidden">
          <div className="divide-y divide-slate-100">
            {pageItems.map((c) => (
              <div key={c.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-ink">{c.patientName}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      {c.id} · 医生：{c.doctorName}
                    </div>
                    <div className="mt-2 text-sm text-slate-700">
                      <span className="text-xs font-semibold text-slate-500">症状</span>
                      <div className="mt-1">{c.symptomsText ?? '-'}</div>
                    </div>
                    <div className="mt-2 text-sm text-slate-700">
                      <span className="text-xs font-semibold text-slate-500">病症</span>
                      <div className="mt-1">{c.diagnosisText ?? '-'}</div>
                    </div>
                    <div className="mt-2 text-sm text-slate-700">
                      <span className="text-xs font-semibold text-slate-500">方剂</span>
                      <div className="mt-1">{c.formulaName ?? '-'}</div>
                    </div>
                    <div className="mt-2 text-xs text-slate-500">更新：{formatDateTime(c.updatedAt)}</div>
                  </div>
                </div>
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => setOpenConsultationId(c.id)}
                    className="inline-flex h-9 w-full items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-soft-card hover:bg-emerald-700"
                  >
                    查看操作
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
          <HorizontalScroll className="touch-pan-x overscroll-x-contain rounded-2xl border border-slate-100 bg-white/70">
            <table className="w-full min-w-[1160px] table-fixed text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="w-[12%] px-4 py-3">问诊ID</th>
                  <th className="w-[12%] px-4 py-3">医生</th>
                  <th className="w-[12%] px-4 py-3">患者</th>
                  <th className="w-[22%] px-4 py-3">症状</th>
                  <th className="w-[22%] px-4 py-3">病症</th>
                  <th className="w-[16%] px-4 py-3">方剂</th>
                  <th className="w-[12%] px-4 py-3">更新时间</th>
                  <th className="w-[10%] px-4 py-3 text-center">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pageItems.map((c) => (
                  <tr key={c.id} className="hover:bg-white/50">
                    <td className="truncate px-4 py-3 font-semibold text-ink" title={c.id}>
                      {c.id}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{c.doctorName}</td>
                    <td className="px-4 py-3 text-slate-700">{c.patientName}</td>
                    <td className="truncate px-4 py-3 text-slate-700" title={c.symptomsText ?? ''}>
                      {c.symptomsText ?? '-'}
                    </td>
                    <td className="truncate px-4 py-3 text-slate-700" title={c.diagnosisText ?? ''}>
                      {c.diagnosisText ?? '-'}
                    </td>
                    <td className="truncate px-4 py-3 text-slate-700" title={c.formulaName ?? ''}>
                      {c.formulaName ?? '-'}
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
                    <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                      无匹配记录
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </HorizontalScroll>
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
