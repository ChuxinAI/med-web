import { useCatalog } from '../../api/queries'
import { Badge } from '../../components/Badge'
import { Card } from '../../components/Card'

export function KnowledgePage() {
  const { data: catalog } = useCatalog()

  return (
    <div className="grid grid-cols-2 gap-4">
      <Card title="结构化知识库">
        <div className="space-y-3 text-sm text-slate-700">
          {catalog?.map((item) => (
            <div key={item.id} className="rounded-xl border border-slate-100 bg-white/80 p-3 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-ink">{item.name}</p>
                <Badge tone="info">{item.category}</Badge>
              </div>
              <p className="mt-1 text-slate-600">{item.description}</p>
              {item.linkedTo && (
                <p className="mt-1 text-xs text-slate-500">关联：{item.linkedTo.join(' / ')}</p>
              )}
            </div>
          ))}
        </div>
      </Card>
      <Card title="向量检索 + 模型兜底" action={<span className="text-xs text-slate-500">pgvector top-k + LLM</span>}>
        <div className="space-y-3 text-sm text-slate-700">
          <p>低置信度时调用检索/模型，前端标注来源。</p>
          <div className="rounded-xl bg-gradient-to-r from-primary-50 to-emerald-50 p-4">
            <p className="text-sm font-semibold text-primary-800">BAAI/bge-small-zh-v1.5 · 512 维</p>
            <p className="text-xs text-slate-600">离线生成 embedding，在线 top-k 检索。</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
