import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDoctorPatients, useUpdateDoctorPatient } from '../../api/queries'
import { Card } from '../../components/Card'
import { TablePagination } from '../../components/TablePagination'
import { getPatientAge } from '../../lib/patient'
import { PatientEditModal } from '../../components/PatientEditModal'
import type { Patient } from '../../types'

export function AdminPatientsPage() {
  const { data: patients } = useDoctorPatients()
  const updatePatient = useUpdateDoctorPatient()
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [editing, setEditing] = useState<Patient | null>(null)

  const filtered = useMemo(() => {
    const keyword = q.trim()
    return (patients ?? []).filter((p) => {
      if (!keyword) return true
      return [p.id, p.name, p.doctorName, p.region, p.phone, p.email]
        .filter(Boolean)
        .join(' ')
        .includes(keyword)
    })
  }, [patients, q])

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
            placeholder="检索：医生/患者/地区/电话/邮箱/ID"
            className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 sm:w-80"
          />
        </div>
      }
    >
      <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white/70">
        <table className="w-full min-w-[980px] table-fixed text-left text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              <th className="w-[16%] px-4 py-3">患者ID</th>
              <th className="w-[14%] px-4 py-3">医生</th>
              <th className="w-[14%] px-4 py-3">患者</th>
              <th className="w-[10%] px-4 py-3">年龄</th>
              <th className="w-[14%] px-4 py-3">地区</th>
              <th className="w-[16%] px-4 py-3">电话</th>
              <th className="w-[22%] px-4 py-3">邮箱</th>
              <th className="w-[14%] px-4 py-3 text-center">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pageItems.map((p) => (
              <tr key={p.id} className="hover:bg-white/50">
                <td className="px-4 py-3 font-semibold text-ink">{p.id}</td>
                <td className="px-4 py-3 text-slate-700">{p.doctorName ?? '-'}</td>
                <td className="px-4 py-3 text-slate-700">{p.name}</td>
                <td className="px-4 py-3 text-slate-700">{getPatientAge(p) ?? ''}</td>
                <td className="px-4 py-3 text-slate-700">{p.region ?? '-'}</td>
                <td className="px-4 py-3 text-slate-700">{p.phone ?? '-'}</td>
                <td className="truncate px-4 py-3 text-slate-700">{p.email ?? '-'}</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditing(p)}
                      className="inline-flex h-8 items-center justify-center rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white shadow-soft-card hover:bg-emerald-700"
                    >
                      编辑
                    </button>
                    <Link
                      to={`/admin/stats/cases?patientId=${encodeURIComponent(p.id)}`}
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
                <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
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

      <PatientEditModal
        open={Boolean(editing)}
        patient={editing}
        onClose={() => setEditing(null)}
        onSave={async ({ patientId, patch }) => {
          await updatePatient.mutateAsync({ patientId, patch })
        }}
      />
    </Card>
  )
}
