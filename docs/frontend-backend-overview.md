# med 前端逻辑梳理与后端接口需求

本文档基于当前前端实现（`src/` 中页面与后端 API）整理，覆盖前端整体逻辑、路由结构与后端接口需求，供前后端对齐。

## 1. 范围与现状

- 前端技术栈：Vite + React + TypeScript + Tailwind + React Router + @tanstack/react-query。
- 数据层：通过 `src/api/backendApi.ts` 对接后端 API，并由 `src/api/queries.ts` 提供 hooks。
- 认证状态：登录页写入 access/refresh token，路由由 `AuthGate` 做鉴权守卫。
- 存储：`localStorage` 用于保存最近一次问诊 ID（key: `doctor:lastConsultationId`）。
- 核心类型：以 `src/types.ts` 为准，包含 `CaseStatus(open|in_review|closed)`、`ConsultationDraft`、`ConsultationSuggestion`、`Citation` 等。

## 2. 路由结构

### 2.1 顶层路由
- `/` → 重定向到 `/doctor/login`
- `/login` → 重定向到 `/doctor/login`
- `/doctor/login` / `/doctor/register`
- `/admin/login`

### 2.2 医生端
- `/doctor/consultations`：问诊列表
- `/doctor/consultations/:caseId`：问诊详情（DoctorWorkspace）
- `/doctor/chat`：独立问诊对话页（带病例草稿侧栏）
- `/doctor/patients` / `/doctor/patients/:patientId`：患者列表/详情
- `/doctor/knowledge`：结构化知识目录展示
- `/doctor/settings`

### 2.3 管理端
- `/admin/users`：用户管理
- `/admin/catalog`：病症管理
- `/admin/stats/overview`：统计总览
- `/admin/stats/consultations`：问诊统计/查看
- `/admin/stats/patients`：患者统计/查看
- `/admin/settings`

备注：`/doctor/patients/:id` 的“发起问诊”按钮跳转至 `/doctor/chat?patientId=...`，但 `ChatPage` 并未读取该参数，逻辑尚未打通。

## 3. 前端核心逻辑梳理

### 3.1 数据与状态管理
- 所有请求封装在 `src/api/backendApi.ts`，并由 `src/api/queries.ts` 提供 query/mutation hooks。
- `react-query` 负责缓存与失效刷新，局部筛选、分页、排序为页面本地 state。
- Query key 规则：
  - 医生端：`['cases']`、`['doctor','patients']` 等
  - 管理端：`['admin','users']`、`['admin','stats']` 等

### 3.2 医生端主要流程

1) 问诊列表（/doctor/consultations）
- 数据：`useDoctorCases()` + `useDoctorPatients()`
- 功能：患者筛选、状态筛选、关键词检索（ID/患者/症状/病症）
- 操作：打开 `ConsultationWorkspaceModal` 进行继续问诊（同一组件也在管理端统计中用于只读查看）

2) 问诊对话（/doctor/chat）
- 自动创建问诊：首次进入会调用 `createConsultation()`，并缓存最后问诊 ID
- 对话消息：`useCaseMessages()` + `useSendConsultationMessage()`
- 病例草稿：`useConsultationDraft()` + `useUpdateConsultationDraft()`
- 病例结构化面板：`CaseBuilderPanel` 支持症状/病症/方剂/备注编辑、患者关联；字段状态为 `empty/suggested/confirmed/edited`
- 候选建议：`useCaseSuggestions()` 返回 `ConsultationSuggestion`（疾病/证型/方剂候选、追问建议、置信度）
- 引用预览：消息中的 `Citation` → `SourcePreviewModal`（来源于病症管理数据，仅展示病症详情卡片）

3) 问诊详情（/doctor/consultations/:caseId）
- 进入后渲染 `DoctorWorkspace`（对话 + 草稿侧栏）

4) 患者管理（/doctor/patients）
- 列表筛选：城市/关键词/排序/分页
- 新建患者：`PatientUpsertModal` + `createDoctorPatient()`
- 详情页：展示患者摘要信息，可发起问诊

5) 知识展示（/doctor/knowledge）
- 仅展示 `CatalogEntry` 结构化目录；无需检索

### 3.3 管理端主要流程

1) 用户管理（/admin/users）
- 列表检索/筛选/分页
- 编辑字段：org、realName、region、phone、email、note
- 操作：封禁/解封、重置密码
- 规则：不允许封禁当前用户；不允许封禁最后一个启用管理员

2) 病症管理（/admin/catalog）
- 列表检索/分页
- 新增/编辑病症（name、symptoms、formula、note）
- 支持 Excel 批量导入（`.xlsx/.xls`，前端使用 `XLSX` 解析）
- 可跳转查看相关问诊（带 `disease` 过滤）

3) 统计总览（/admin/stats/overview）
- `useAdminStats()`：医生问诊量、病症问诊量、方剂问诊量、医生城市分布

4) 问诊统计（/admin/stats/consultations）
- 列表检索/过滤（患者、病症、状态）
- 打开只读问诊窗口（`ConsultationWorkspaceModal` with readOnly）

5) 患者统计（/admin/stats/patients）
- 跨医生患者列表，支持编辑患者信息

## 4. 后端接口需求（按模块）

### 4.1 Auth / Me
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /me`
- `PATCH /me`
- `POST /me/password`

### 4.2 Admin｜用户管理
- `GET /admin/users?q=&role=&status=&page=&pageSize=&sort=&order=&updatedFrom=&updatedTo=`
- `POST /admin/users`
- `GET /admin/users/:userId`
- `PATCH /admin/users/:userId`
- `POST /admin/users/:userId/ban`
- `POST /admin/users/:userId/unban`
- `POST /admin/users/:userId/reset-password`

字段对齐（`UserSummary`）：
- `id, role, username?, name?, realName?, org?, region?, phone?, email?, note?`
- `status(active|suspended)`, `registeredAt?`, `lastLoginAt?`, `registerIp?`, `lastLoginIp?`, `createdAt`, `lastActive`

### 4.3 Admin｜病症管理
- `GET /admin/diseases?q=&page=&pageSize=&sort=&order=&updatedFrom=&updatedTo=`
- `POST /admin/diseases`
- `PATCH /admin/diseases/:diseaseId`
- `POST /admin/diseases/import`（Excel 批量导入，multipart）

字段对齐（`Disease`）：
- `id, name, symptoms, formula, note?, createdAt, updatedAt`

### 4.4 Admin｜统计
- `GET /admin/stats/overview`
  - 返回 `AdminStats`：`doctorConsultations[]`、`syndromeConsultations[]`、`formulaConsultations[]`、`doctorCityCounts[]`
- `GET /admin/stats/consultations?q=&doctorId=&patientId=&status=&disease=&page=&pageSize=&sort=&order=&updatedFrom=&updatedTo=`
- `GET /admin/stats/patients?q=&doctorId=&region=&page=&pageSize=&sort=&order=&updatedFrom=&updatedTo=`
### 4.5 Doctor｜问诊（Consultation）
- `GET /doctor/consultations?q=&patientId=&page=&pageSize=&sort=&order=&updatedFrom=&updatedTo=`
- `POST /doctor/consultations`（可携带 `patientId`）
- `GET /doctor/consultations/:consultationId`
- `GET /doctor/consultations/:consultationId/messages?page=&pageSize=`
- `POST /doctor/consultations/:consultationId/messages`（SSE）
  - `GET /doctor/consultations/:consultationId/suggestions`（`ConsultationSuggestion`）
  - `GET /doctor/consultations/:consultationId/draft`
  - `PATCH /doctor/consultations/:consultationId/draft`
  - `POST /doctor/consultations/:consultationId/close`（可选）

消息发送返回建议包含：
- `assistantMessage`（Message）
- `citations[]`（引用：病症管理条目）
- `extractions`（病例字段候选）
- `nextQuestions[]`
流式说明：
- `delta` 事件仅包含回复文本片段（用于实时展示）
- `done` 事件返回结构化建议（等价 `ConsultationSuggestionOut`），候选病症概率在此时统一返回

### 4.6 Doctor｜患者（Patient）
- `GET /doctor/patients?q=&page=&pageSize=&sort=&order=&updatedFrom=&updatedTo=`
- `POST /doctor/patients`
- `GET /doctor/patients/:patientId`
- `PATCH /doctor/patients/:patientId`

字段对齐：
- `id, name, gender?, age?, birthday?, region?, phone?, email?, note?, doctorName?, createdAt, updatedAt`

### 4.7 结构化知识目录
- `GET /catalog` 或 `GET /doctor/catalog`

字段对齐（`CatalogEntry`）：
- `id, name, category(disease|syndrome|symptom|formula), description, linkedTo?`

## 5. 通用约束与规范

1) 权限与限制
- 管理端查看问诊必须只读，禁止 `POST /doctor/consultations/:id/messages`
- 不允许封禁当前登录用户
- 不允许封禁最后一个启用管理员

2) 统一分页/排序/检索
- `page`（1-based）+ `pageSize`
- `sort` + `order`（默认 `updatedAt desc`）
- 时间范围：`updatedFrom`、`updatedTo`（ISO8601）
- 模糊检索统一 `q`
- 列表返回：`items`, `total`, `page`, `pageSize`

3) 引用与预览
- 引用来自病症管理：`Citation` 建议包含 `diseaseId/diseaseName`
- 预览仅展示病症详情卡片（症状/方剂/备注），不需要文件链接

4) 错误格式建议
- HTTP 状态码语义化（400/401/403/404/409/422/500）
- 返回体：`code`, `message`, `details?`
