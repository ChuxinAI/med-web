# med-web AGENTS

本文件用于快速了解本项目结构、运行方式与关键约定。

## 项目概览
- 前端骨架：医生端 + 管理端问诊系统演示
- 技术栈：Vite + React + TypeScript + Tailwind + React Router + @tanstack/react-query
- 数据来源：以 `src/api/backendApi.ts` 为主
- 认证：基于 `/auth/me` 做简单鉴权守卫，登录态由 access/refresh token 维持（医生端/管理端分开存储）
- 存储：`localStorage` 保存最近问诊 ID（`doctor:lastConsultationId:<userId>`）、候选计算缓存（`consultation-suggestion:<consultationId>`）、推理选择记录（`consultation-reasoning:<consultationId>` / `consultation-reasoning-confirmed:<consultationId>`）

## 常用命令
- 安装依赖：`npm install`
- 本地开发：`npm run dev`（默认端口 5174，可用 `VITE_DEV_PORT`/`PORT` 覆盖；online 模式默认 8100）
- 本地开发（sandbox）：`npm run dev:sandbox`
- 本地开发（online）：`npm run dev:online`
- 构建：`npm run build`
- 构建（sandbox）：`npm run build:sandbox`
- 构建（online）：`npm run build:online`

## 环境配置
- 读取方式：Vite env（`import.meta.env`）
- 当前使用：`VITE_API_BASE_URL`（默认 `http://localhost:8100`）
- Online 环境：前端对外端口 8100，API 地址见 `.env.online`
- 环境文件：
  - `.env.sandbox`：sandbox 环境
  - `.env.online`：online 环境
- 使用方式：启动/构建时通过 `--mode` 加载对应环境文件

## 目录与关键文件
- 路由：`src/router.tsx`
- 布局：`src/layouts/DoctorLayout.tsx`、`src/layouts/AdminLayout.tsx`
- 页面：
  - 医生端：`src/pages/doctor/*`
  - 管理端：`src/pages/admin/*`
  - 登录：`src/pages/auth/*`
- 组件：`src/components/*`
- 数据查询：
  - `src/api/queries.ts`
- 后端接口：
  - `src/api/backendApi.ts`
  - `src/api/backendTypes.ts`
  - `src/api/backendMappers.ts`
- 类型定义：`src/types.ts`
- 设计与主题：`src/index.css`、`tailwind.config.js`
- 接口/逻辑说明：`docs/frontend-backend-overview.md`
- 部署说明：`docs/deploy-aliyun.md`

## 更新约定
- 每次做更新前后都检查本文件是否需要同步更新
- 重大改动先给执行方案并确认关键问题，再开始写代码

## 接口校验
- 需要核对接口或字段时，查看后端文档：`http://localhost:8100/docs`
- 以 `http://localhost:8100/openapi.json` 为准核对字段名、枚举值与返回结构

## 前端数据流（高频入口）
- 列表页筛选/分页/排序为页面本地 state
- 数据拉取与缓存由 React Query 负责（`src/api/queries.ts`）
- 问诊对话与草稿：
  - 消息：`useCaseMessages` / `useSendConsultationMessage`
  - 草稿：`useConsultationDraft` / `useUpdateConsultationDraft`（字段拆分为 `/doctor/consultations/{id}` 的 `symptoms`/`disease`/`formula`/`note`）
  - 建议：`useCaseSuggestions`
  - 推理选择：优先使用 `pending_symptom_groups`，为空时使用 `pending_symptoms`（后端已归一化）
  - 消息发送：`/doctor/consultations/{id}/messages` 使用 SSE 流式响应
    - `delta` 仅包含回复文本片段；`done` 返回结构化建议，候选病症概率在 `done` 统一返回
- 模型决策：`/doctor/consultations/{id}/dialogue/stream`（`mode=model_decision`，SSE：`delta` 文本片段，`done` 返回 `reply`/`candidate_diseases`/`confirmed_symptoms`/`decision`）
- 采纳疾病总结：`/doctor/consultations/{id}/dialogue/stream`（`mode=adopted_summary`，必填 `adopted_disease_id`，消息内容：`采纳病症：{疾病名}`）

## 引用与预览约定
- 引用来自病症管理数据（`Disease`）
- 预览仅展示病症详情卡片（类型名称/类型/症状描述/鉴别方法/方剂/备注），不使用文件预览

## 病症字段约定
- 字段：`name`、`type_name`、`type_code`、`symptoms`、`differentiation`、`formula`、`note`
- `type_code` 固定值：`disease`、`syndrome`、`symptom`

## 注意事项
- `/doctor/patients/:id` 页面发起问诊仍未打通 `patientId` 参数
- 模型决策回复提供采纳入口，调用 `/doctor/consultations/extract-disease-formula` 抽取病症/方剂并写入草稿

## 错误记录
- 2026-01-22：前端疾病字段曾与后端不一致（使用 `type`/`symptomDescription`/`differentiationMethod`），导致接口对接偏差；以后改动需先核对 `openapi.json` 字段。
- 2026-01-23：问诊返回存在 `id` 与 `code` 字段时，前端只使用 `id`，不要依赖 `code`。
- 2026-01-24：`rsync --delete` 目标目录不要与源码目录同级混用，否则会清理掉源码；建议部署到独立子目录（如 `site/`）。
- 2026-01-28：新增/编辑/导入病症后未失效 `catalog` 查询，医生端候选详情缺失；病症管理相关 mutation 需同步失效 `['catalog']`。
- 2026-01-28：CaseBuilderPanel 会把 `suggestedSymptoms` 重新写回症状字段，用户手动编辑后会被覆盖；症状状态为 `edited/confirmed` 时不要再自动合并建议。
- 2026-01-28：症状编辑被系统回写的问题再次出现；draft `updatedAt` 变更但症状未变时不要覆盖本地编辑，仅在出现全新的建议时增量合并到已有症状，保持手工修改优先。
- 2026-01-28：开启新问诊会带上旧问诊，原因是 `lastConsultationStorageKey` 未清空且自动回退到最新问诊；重置时要移除本地存储并跳过旧 ID 回填。

## 后端接口文档
- 通过 http://localhost:8100/docs 确认接口调用是否正确及是否有新功能
