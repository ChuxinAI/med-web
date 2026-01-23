import { useMemo, useState } from 'react'
import { useAdminStats, useAdminUsers } from '../../api/queries'
import { Card } from '../../components/Card'
import { HorizontalScroll } from '../../components/HorizontalScroll'
import { TablePagination } from '../../components/TablePagination'

type StatRow = {
  name: string
  count: number
}

const tabOptions = [
  { key: 'doctor', label: '医生问诊量', nameLabel: '医生', countLabel: '问诊数量' },
  { key: 'syndrome', label: '病症问诊量', nameLabel: '病症', countLabel: '问诊数量' },
  { key: 'formula', label: '方剂问诊量', nameLabel: '方剂', countLabel: '问诊数量' },
  { key: 'city', label: '医生最多城市', nameLabel: '城市', countLabel: '医生数量' },
] as const

type TabKey = (typeof tabOptions)[number]['key']

export function AdminStatsOverviewPage() {
  const { data } = useAdminStats()
  const { data: users } = useAdminUsers()
  const [activeTab, setActiveTab] = useState<TabKey>('doctor')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const doctorNameMap = useMemo(() => {
    const map = new Map<string, string>()
    ;(users ?? []).forEach((user) => {
      if (user.id) map.set(user.id, user.name)
      if (user.username) map.set(user.username, user.name)
      if (user.name) map.set(user.name, user.name)
    })
    return map
  }, [users])

  const rows = useMemo<StatRow[]>(() => {
    if (!data) return []
    const items = (() => {
      switch (activeTab) {
      case 'doctor':
          return data.doctorConsultations.map((item) => ({
          name: doctorNameMap.get(item.doctorName) ?? item.doctorName,
          count: item.count,
        }))
      case 'syndrome':
          return data.syndromeConsultations.map((item) => ({ name: item.syndrome, count: item.count }))
      case 'formula':
          return data.formulaConsultations.map((item) => ({ name: item.formula, count: item.count }))
      case 'city':
          return data.doctorCityCounts.map((item) => ({ name: item.city, count: item.count }))
      default:
          return []
      }
    })()
    return items.sort((a, b) => b.count - a.count)
  }, [activeTab, data, doctorNameMap])

  const total = rows.length
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, pageCount)
  const pageItems = useMemo(
    () => rows.slice((safePage - 1) * pageSize, (safePage - 1) * pageSize + pageSize),
    [pageSize, rows, safePage],
  )

  const activeTabMeta = tabOptions.find((item) => item.key === activeTab) ?? tabOptions[0]

  return (
    <Card
      title="数据统计"
      action={
        <div className="flex flex-wrap items-center gap-2">
          {tabOptions.map((item) => {
            const active = item.key === activeTab
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  setActiveTab(item.key)
                  setPage(1)
                }}
                className={`h-9 rounded-xl px-3 text-sm font-semibold transition ${
                  active
                    ? 'bg-primary-600 text-white shadow-soft-card'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            )
          })}
        </div>
      }
    >
      <HorizontalScroll className="touch-pan-x overscroll-x-contain rounded-2xl border border-slate-100 bg-white/70">
        <table className="w-full min-w-[480px] table-fixed text-left text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              <th className="w-[70%] px-4 py-3">{activeTabMeta.nameLabel}</th>
              <th className="w-[30%] px-4 py-3 text-right">{activeTabMeta.countLabel}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pageItems.map((item) => (
              <tr key={`${activeTab}-${item.name}`} className="hover:bg-white/50">
                <td className="truncate px-4 py-3 text-ink" title={item.name}>
                  {item.name}
                </td>
                <td className="px-4 py-3 text-right text-slate-700">{item.count}</td>
              </tr>
            ))}
            {pageItems.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-4 py-10 text-center text-slate-500">
                  暂无数据
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </HorizontalScroll>

      <div className="mt-4">
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
      </div>
    </Card>
  )
}
