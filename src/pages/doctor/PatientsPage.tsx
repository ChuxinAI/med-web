import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCreateDoctorPatient, useDoctorPatients } from '../../api/queries'
import { Card } from '../../components/Card'
import { CreatedAtSortToggle } from '../../components/CreatedAtSortToggle'
import { InlineNotice } from '../../components/InlineNotice'
import { PatientUpsertModal } from '../../components/PatientUpsertModal'
import { TablePagination } from '../../components/TablePagination'
import { HorizontalScroll } from '../../components/HorizontalScroll'
import { formatDateTime } from '../../lib/datetime'
import { getPatientAge } from '../../lib/patient'

export function PatientsPage() {
  const { data: patients } = useDoctorPatients()
  const createPatient = useCreateDoctorPatient()
  const [q, setQ] = useState('')
  const [region, setRegion] = useState('all')
  const [order, setOrder] = useState<'asc' | 'desc'>('desc')
  const [createOpen, setCreateOpen] = useState(false)
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; message: string } | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const regions = useMemo(() => {
    const set = new Set((patients ?? []).map((p) => p.region).filter(Boolean) as string[])
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'zh-CN'))
  }, [patients])

  const filtered = useMemo(() => {
    const keyword = q.trim()
    return (patients ?? [])
      .filter((p) => (region === 'all' ? true : p.region === region))
      .filter((p) => {
        if (!keyword) return true
        const haystack = [p.id, p.name, p.region, p.phone, p.email].filter(Boolean).join(' ')
        return haystack.includes(keyword)
      })
      .sort((a, b) => {
        const dir = order === 'asc' ? 1 : -1
        return (a.createdAt > b.createdAt ? 1 : -1) * dir
      })
  }, [order, patients, q, region])

  const total = filtered.length
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, pageCount)
  const pageItems = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, (safePage - 1) * pageSize + pageSize),
    [filtered, pageSize, safePage],
  )

  return (
    <Card
      title="患者管理"
      action={
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setPage(1)
            }}
            placeholder="检索：姓名/电话/地区/邮箱/ID"
            className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 sm:w-56"
          />
          <select
            value={region}
            onChange={(e) => {
              setRegion(e.target.value)
              setPage(1)
            }}
            className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 sm:w-auto"
          >
            <option value="all">全部地区</option>
            {regions.map((r) => (
              <option key={r} value={r}>
                {r}
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
          <button
            type="button"
            onClick={() => {
              setNotice(null)
              setCreateOpen(true)
            }}
            className="h-9 w-full rounded-xl bg-primary-600 px-3 text-sm font-semibold text-white shadow-soft-card transition hover:bg-primary-700 sm:w-auto"
          >
            新建患者
          </button>
        </div>
      }
    >
      {notice ? <InlineNotice tone={notice.tone} message={notice.message} /> : null}
      <div className="rounded-2xl border border-slate-100 bg-white/70 lg:hidden">
        <div className="divide-y divide-slate-100">
          {pageItems.map((p) => (
            <div key={p.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link to={`/doctor/patients/${p.id}`} className="font-semibold text-ink hover:underline">
                    {p.name}
                  </Link>
                  <div className="mt-1 text-xs text-slate-500">{p.id}</div>
                  <div className="mt-2 text-sm text-slate-700">
                    {(p.gender ?? '-')}{getPatientAge(p) != null ? ` · ${getPatientAge(p)} 岁` : ''}
                    {p.region ? ` · ${p.region}` : ''}
                  </div>
                  <div className="mt-2 text-xs text-slate-500">更新：{formatDateTime(p.updatedAt)}</div>
                  {p.phone || p.email ? (
                    <div className="mt-1 text-xs text-slate-500">
                      {[p.phone, p.email].filter(Boolean).join(' · ')}
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  to={`/doctor/patients/${p.id}`}
                  className="inline-flex h-9 items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-soft-card hover:bg-emerald-700"
                >
                  编辑
                </Link>
                <Link
                  to={`/doctor/cases?patientId=${encodeURIComponent(p.id)}`}
                  className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  查看病例
                </Link>
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
          <table className="w-full min-w-[980px] table-fixed text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="w-32 px-4 py-3">患者ID</th>
                <th className="w-28 px-4 py-3">姓名</th>
                <th className="w-20 px-4 py-3">性别</th>
                <th className="w-20 px-4 py-3">年龄</th>
                <th className="w-28 px-4 py-3">地区</th>
                <th className="w-36 px-4 py-3">电话</th>
                <th className="px-4 py-3">邮箱</th>
                <th className="w-52 px-4 py-3">更新时间</th>
                <th className="w-40 px-4 py-3 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pageItems.map((p) => (
                <tr key={p.id} className="hover:bg-white/50">
                  <td className="px-4 py-3">
                    <Link to={`/doctor/patients/${p.id}`} className="font-semibold text-ink hover:underline">
                      {p.id}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-semibold text-ink">{p.name}</td>
                  <td className="px-4 py-3 text-slate-700">{p.gender ?? '-'}</td>
                  <td className="px-4 py-3 text-slate-700">{getPatientAge(p) ?? ''}</td>
                  <td className="px-4 py-3 text-slate-700">{p.region ?? '-'}</td>
                  <td className="px-4 py-3 text-slate-700">{p.phone ?? '-'}</td>
                  <td className="truncate px-4 py-3 text-slate-700">{p.email ?? '-'}</td>
                  <td className="px-4 py-3 text-slate-700">{formatDateTime(p.updatedAt)}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Link
                        to={`/doctor/patients/${p.id}`}
                        className="inline-flex h-8 items-center justify-center rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white shadow-soft-card hover:bg-emerald-700"
                      >
                        编辑
                      </Link>
                      <Link
                        to={`/doctor/cases?patientId=${encodeURIComponent(p.id)}`}
                        className="inline-flex h-8 items-center justify-center rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white shadow-soft-card hover:bg-emerald-700"
                      >
                        查看病例
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {pageItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-slate-500">
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

      <PatientUpsertModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        hint="创建成功后可在患者管理中查看"
        onCreate={async (input) => {
          await createPatient.mutateAsync(input)
          setNotice({ tone: 'success', message: '患者已创建。' })
        }}
      />
    </Card>
  )
}
