import { useMemo, useRef, useState } from 'react'
import {
  useDeleteKnowledgeFile,
  useKnowledgeFiles,
  useSearchKnowledge,
  useUploadKnowledgeFiles,
} from '../../api/queries'
import { Card } from '../../components/Card'
import { InlineNotice } from '../../components/InlineNotice'
import { CreatedAtSortToggle } from '../../components/CreatedAtSortToggle'
import { SourcePreviewModal } from '../../components/SourcePreviewModal'
import { TablePagination } from '../../components/TablePagination'
import { HorizontalScroll } from '../../components/HorizontalScroll'
import { formatDateTime } from '../../lib/datetime'
import type { Citation, KnowledgeFile, KnowledgeSearchHit } from '../../types'

export function CatalogPage() {
  const { data: files } = useKnowledgeFiles()
  const deleteFile = useDeleteKnowledgeFile()
  const uploadFiles = useUploadKnowledgeFiles()

  const [fileQ, setFileQ] = useState('')
  const [fileOrder, setFileOrder] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const { data: hits } = useSearchKnowledge(search)
  const [searchOpen, setSearchOpen] = useState(false)

  const [notice, setNotice] = useState<{ tone: 'success' | 'error' | 'info'; message: string } | null>(null)

  const [preview, setPreview] = useState<Citation | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const filteredFiles = useMemo(() => {
    const keyword = fileQ.trim()
    return (files ?? [])
      .filter((f) => (keyword ? f.fileName.includes(keyword) : true))
      .sort((a, b) => {
        const dir = fileOrder === 'asc' ? 1 : -1
        return (a.createdAt > b.createdAt ? 1 : -1) * dir
      })
  }, [fileOrder, fileQ, files])

  const total = filteredFiles.length
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, pageCount)
  const pageItems = useMemo(
    () => filteredFiles.slice((safePage - 1) * pageSize, (safePage - 1) * pageSize + pageSize),
    [filteredFiles, pageSize, safePage],
  )

  return (
    <div className="space-y-4">
      <Card
        title="知识管理"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={fileQ}
              onChange={(e) => {
                setFileQ(e.target.value)
                setPage(1)
              }}
              placeholder="按文件名过滤"
              className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 sm:w-56"
            />
            <CreatedAtSortToggle
              order={fileOrder}
              onToggle={() => {
                setFileOrder((p) => (p === 'asc' ? 'desc' : 'asc'))
                setPage(1)
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="h-9 w-full rounded-xl bg-primary-600 px-3 text-sm font-semibold text-white shadow-soft-card hover:bg-primary-700 sm:w-auto"
            >
              上传文件
            </button>
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:w-auto"
            >
              全库检索
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                const list = Array.from(e.target.files ?? [])
                if (list.length === 0) return
                void uploadFiles
                  .mutateAsync({ files: list.map((f) => ({ name: f.name, size: f.size })) })
                  .then(() => setNotice({ tone: 'success', message: '文件已上传（Mock），入库处理中。' }))
                  .catch((err) =>
                    setNotice({
                      tone: 'error',
                      message: err instanceof Error ? err.message : '上传失败',
                    }),
                  )
                e.currentTarget.value = ''
              }}
            />
          </div>
        }
      >
        {notice ? <InlineNotice tone={notice.tone} message={notice.message} /> : null}
        <div className="rounded-2xl border border-slate-100 bg-white/70 lg:hidden">
          <div className="divide-y divide-slate-100">
            {pageItems.map((f) => (
              <div key={f.id} className="p-4">
                <button
                  type="button"
                  onClick={() => setPreview(fileToCitation(f, 1))}
                  className="w-full text-left font-semibold text-ink hover:underline"
                  title={f.fileName}
                >
                  {f.fileName}
                </button>
                <div className="mt-2 text-xs text-slate-500">
                  {f.fileType} · {formatBytes(f.fileSize)} · {statusLabel(f.status)}
                </div>
                <div className="mt-1 text-xs text-slate-500">更新：{formatDateTime(f.updatedAt)}</div>
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={async () => {
                      const ok = window.confirm('确认删除该文件？删除后可重新上传。')
                      if (!ok) return
                      try {
                        await deleteFile.mutateAsync({ fileId: f.id })
                        setNotice({ tone: 'success', message: '已删除文件。' })
                      } catch (e) {
                        setNotice({ tone: 'error', message: e instanceof Error ? e.message : '删除失败' })
                      }
                    }}
                    className="inline-flex h-9 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
            {pageItems.length === 0 ? (
              <div className="px-4 py-10 text-center text-slate-500">暂无文件</div>
            ) : null}
          </div>
        </div>

        <div className="hidden lg:block">
          <HorizontalScroll className="touch-pan-x overscroll-x-contain rounded-2xl border border-slate-100 bg-white/70">
            <table className="w-full min-w-[860px] table-fixed text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="w-[46%] px-4 py-3">文件名</th>
                  <th className="w-[12%] px-4 py-3">类型</th>
                  <th className="w-[14%] px-4 py-3 text-right">大小</th>
                  <th className="w-[16%] px-4 py-3">状态</th>
                  <th className="w-[12%] px-4 py-3 text-center">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pageItems.map((f) => (
                  <tr key={f.id} className="hover:bg-white/50">
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setPreview(fileToCitation(f, 1))}
                        className="truncate font-semibold text-ink hover:underline"
                        title={f.fileName}
                      >
                        {f.fileName}
                      </button>
                      <div className="mt-1 text-xs text-slate-500">更新：{formatDateTime(f.updatedAt)}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{f.fileType}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{formatBytes(f.fileSize)}</td>
                    <td className="px-4 py-3 text-slate-700">{statusLabel(f.status)}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={async () => {
                          const ok = window.confirm('确认删除该文件？删除后可重新上传。')
                          if (!ok) return
                          try {
                            await deleteFile.mutateAsync({ fileId: f.id })
                            setNotice({ tone: 'success', message: '已删除文件。' })
                          } catch (e) {
                            setNotice({ tone: 'error', message: e instanceof Error ? e.message : '删除失败' })
                          }
                        }}
                        className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
                {pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                      暂无文件
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

      <SourcePreviewModal open={Boolean(preview)} citation={preview} onClose={() => setPreview(null)} />
      <KnowledgeSearchModal
        open={searchOpen}
        query={query}
        setQuery={setQuery}
        search={search}
        onSearch={() => setSearch(query)}
        hits={hits ?? []}
        onClose={() => setSearchOpen(false)}
        onOpenHit={(h) => setPreview(hitToCitation(h))}
      />
    </div>
  )
}

function KnowledgeSearchModal({
  open,
  query,
  setQuery,
  search,
  onSearch,
  hits,
  onClose,
  onOpenHit,
}: {
  open: boolean
  query: string
  setQuery: (v: string) => void
  search: string
  onSearch: () => void
  hits: KnowledgeSearchHit[]
  onClose: () => void
  onOpenHit: (hit: KnowledgeSearchHit) => void
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <button type="button" onClick={onClose} className="absolute inset-0 bg-black/30" aria-label="关闭全库检索" />
      <div className="relative flex h-[80vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-ink">全库检索</p>
            <p className="text-xs text-slate-500">结果包含文件名与页码，可打开原文定位</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            关闭
          </button>
        </div>

        <div className="border-b border-slate-100 bg-white px-5 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="输入关键词（全库）"
              className="h-10 w-80 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
            <button
              type="button"
              onClick={onSearch}
              className="h-10 rounded-xl bg-primary-600 px-4 text-sm font-semibold text-white shadow-soft-card hover:bg-primary-700"
            >
              搜索
            </button>
            {search.trim().length > 0 ? <span className="text-xs text-slate-500">共 {hits.length} 条</span> : null}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50 p-5">
          <div className="space-y-3">
            {hits.map((h) => (
              <div key={h.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-soft-card">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{h.fileName}</p>
                    <p className="text-xs text-slate-500">第 {h.page} 页 · score {h.score ?? '-'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenHit(h)}
                    className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    查看原文
                  </button>
                </div>
                <p className="mt-2 text-sm text-slate-700">{h.snippet}</p>
              </div>
            ))}
            {search.trim().length === 0 ? (
              <div className="rounded-2xl border border-slate-100 bg-white p-6 text-center text-sm text-slate-600">
                输入关键词并点击搜索
              </div>
            ) : hits.length === 0 ? (
              <div className="rounded-2xl border border-slate-100 bg-white p-6 text-center text-sm text-slate-600">
                无匹配片段
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

function statusLabel(status: KnowledgeFile['status']) {
  if (status === 'ready') return '已入库'
  if (status === 'processing') return '处理中'
  return '失败'
}

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(0)} KB`
  if (value < 1024 * 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`
  return `${(value / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

function fileToCitation(file: KnowledgeFile, page: number): Citation {
  return {
    fileId: file.id,
    fileName: file.fileName,
    fileType: file.fileType,
    page,
    viewUrl: file.viewUrl,
  }
}

function hitToCitation(hit: KnowledgeSearchHit): Citation {
  return {
    fileId: hit.fileId,
    fileName: hit.fileName,
    fileType: hit.fileType,
    page: hit.page,
    viewUrl: hit.viewUrl,
  }
}
