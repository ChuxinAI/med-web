import type { ConsultationSuggestion } from '../types'
import { Badge } from './Badge'
import { Card } from './Card'

export function SuggestionPanel({ suggestion }: { suggestion?: ConsultationSuggestion }) {
  if (!suggestion) {
    return <Card title="问诊建议">暂无可用建议</Card>
  }

  return (
    <Card
      title="问诊建议"
      action={
        <Badge tone={suggestion.source === 'model' ? 'warning' : 'info'}>
          {suggestion.source === 'model' ? '模型兜底' : '库内规则'} ·
          置信 {Math.round(suggestion.confidence * 100)}%
        </Badge>
      }
    >
      <div className="space-y-3 text-sm text-slate-700">
        <div>
          <p className="text-xs text-slate-500">疾病/证型</p>
          <div className="mt-1 flex flex-wrap gap-2">
            {suggestion.diseases.map((d) => (
              <Badge key={d} tone="info">
                疾病：{d}
              </Badge>
            ))}
            {suggestion.syndromes.map((s) => (
              <Badge key={s} tone="info">
                证型：{s}
              </Badge>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs text-slate-500">方剂</p>
          <div className="mt-1 flex flex-wrap gap-2">
            {suggestion.formulas.map((f) => (
              <Badge key={f} tone="success">
                {f}
              </Badge>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs text-slate-500">追问</p>
          <div className="mt-2 space-y-1">
            {suggestion.followUps.map((f) => (
              <p key={f}>• {f}</p>
            ))}
          </div>
        </div>
        <p className="text-xs text-slate-500">依据：{suggestion.rationale}</p>
      </div>
    </Card>
  )
}
