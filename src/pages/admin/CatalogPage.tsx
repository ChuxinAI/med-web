import { useCatalog } from '../../api/queries'
import { Badge } from '../../components/Badge'
import { Card } from '../../components/Card'

export function CatalogPage() {
  const { data: catalog } = useCatalog()

  return (
    <div className="grid grid-cols-3 gap-4">
      <Card title="结构化知识库" action={<span className="text-xs text-slate-500">疾病/证型/症状/方剂</span>}>
        <div className="space-y-3 text-sm text-slate-700">
          {catalog?.map((item) => (
            <div key={item.id} className="rounded-2xl border border-slate-100 bg-white/90 p-3 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-ink">{item.name}</p>
                <Badge tone="info">{item.category}</Badge>
              </div>
              <p className="text-slate-600">{item.description}</p>
              {item.linkedTo && (
                <p className="text-xs text-slate-500">关联：{item.linkedTo.join('、')}</p>
              )}
              <div className="mt-2 flex gap-2 text-xs">
                <button className="rounded-lg bg-primary-600 px-3 py-1 text-white">编辑</button>
                <button className="rounded-lg border border-slate-200 px-3 py-1 text-slate-700">删除</button>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card title="抽屉式编辑" action={<span className="text-xs text-slate-500">实时校验 + 提交</span>}>
        <div className="space-y-3 text-sm text-slate-700">
          <p>表单校验（zod/yup）、重复名检测、提交按钮置灰。</p>
          <div className="rounded-xl border border-dashed border-primary-200 bg-primary-50/60 p-4">
            <p className="text-sm font-semibold text-primary-800">配置提示</p>
            <ul className="mt-2 space-y-1 text-xs text-primary-700">
              <li>必填：名称、类别、描述。</li>
              <li>选填：关联疾病/证型/方剂。</li>
              <li>保存时写入审计日志。</li>
            </ul>
          </div>
        </div>
      </Card>
      <Card title="向量检索" action={<span className="text-xs text-slate-500">pgvector 状态</span>}>
        <div className="space-y-2 text-sm text-slate-700">
          <p>embedding：BAAI/bge-small-zh-v1.5 · 512 维。</p>
          <p>索引表：kb_items (embedding vector(512), metadata JSONB)。</p>
          <p>离线生成，在线 top-k 供问诊推理。</p>
        </div>
      </Card>
    </div>
  )
}
