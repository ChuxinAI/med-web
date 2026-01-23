import { useCatalog } from '../../api/queries'
import { Badge } from '../../components/Badge'
import { Card } from '../../components/Card'

export function KnowledgePage() {
  const { data: catalog } = useCatalog()
  const typeLabelMap: Record<string, string> = {
    disease: '疾病',
    syndrome: '症候',
    symptom: '症状',
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Card title="结构化知识库">
        <div className="space-y-3 text-sm text-slate-700">
          {catalog?.map((item) => (
            <div key={item.id} className="rounded-xl border border-slate-100 bg-white/80 p-3 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-ink">{item.name}</p>
                <Badge tone="info">disease</Badge>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                类型：{[item.typeName, typeLabelMap[item.typeCode] ?? item.typeCode].filter(Boolean).join(' / ') || '—'}
              </p>
              <p className="mt-1 text-slate-600">{item.symptoms}</p>
              {item.differentiation ? (
                <p className="mt-1 text-xs text-slate-500">鉴别：{item.differentiation}</p>
              ) : null}
              {item.formula ? (
                <p className="mt-1 text-xs text-slate-500">方剂：{item.formula}</p>
              ) : null}
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
