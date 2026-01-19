# med 前端现状与后端接口整体需求

本文档基于当前前端实现（mock API、页面功能）与 `docs/backend-requirements.md` 的既有约束，整理供后端统一对齐。

## 1. 前端现状概览

### 1.1 数据来源与调用方式
- 当前所有数据均来自 `src/api/mockApi.ts`，通过 `@tanstack/react-query` hooks（`src/api/queries.ts`）读取。
- 前端尚未对接真实后端，所有接口需求需与 mock 结构保持字段一致。

### 1.2 医生端功能
- 问诊流程：问诊列表 -> 进入问诊对话 -> 右侧病例草稿 -> 确认写入病例。
- 患者管理：列表、创建、编辑、详情。
- 病例管理：列表、详情、编辑。
- 知识展示：结构化知识目录展示（Catalog）。

### 1.3 管理端功能
- 用户管理：列表、筛选、编辑、封禁/解封、重置密码。
- 知识库管理：文件上传/删除/状态、全库检索、引用预览。
- 统计看板：病例统计、问诊统计、患者统计。
- 管理端问诊查看只读：前端已禁止发送消息。

### 1.4 关键前端约束
- 知识引用仅支持“页码”级定位。
- 方剂详情为纯文本。
- 管理端查看对话为只读，禁止继续发送。

## 2. 后端接口整体需求（按模块）

### 2.1 认证与个人资料
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /me`
- `PATCH /me`
- `POST /me/password`

### 2.2 用户管理（Admin）
- `GET /admin/users?q=&role=&status=&page=&pageSize=&sort=&order=&updatedFrom=&updatedTo=`
- `POST /admin/users`
- `GET /admin/users/:userId`
- `PATCH /admin/users/:userId`
- `POST /admin/users/:userId/ban`
- `POST /admin/users/:userId/unban`
- `POST /admin/users/:userId/reset-password`

字段对齐（`UserSummary`）：
- `id, role, username, realName, org, region, phone, email, note, status`
- `registeredAt, lastLoginAt, registerIp, lastLoginIp, createdAt, lastActive`

### 2.3 知识库管理与检索（Admin）
- `GET /admin/knowledge/files?q=&page=&pageSize=&sort=updatedAt|createdAt&order=`
- `POST /admin/knowledge/files`（multipart）
- `DELETE /admin/knowledge/files/:fileId`
- `GET /admin/knowledge/search?query=&page=&pageSize=`
- `GET /admin/knowledge/files/:fileId/view`

字段对齐：
- `KnowledgeFile`: `id, fileName, fileType, fileSize, status, createdAt, updatedAt, viewUrl?`
- `KnowledgeSearchHit`: `id, fileId, fileName, fileType, page, snippet, score?, viewUrl?`

### 2.4 医生端问诊（Consultation）
- `GET /doctor/consultations?q=&patientId=&page=&pageSize=&sort=&order=&updatedFrom=&updatedTo=`
- `POST /doctor/consultations`（可携带 `patientId`）
- `GET /doctor/consultations/:consultationId`
- `GET /doctor/consultations/:consultationId/messages?page=&pageSize=`
- `POST /doctor/consultations/:consultationId/messages`
- `PATCH /doctor/consultations/:consultationId/draft`
- `POST /doctor/consultations/:consultationId/close`（可选）

消息发送返回应包含：
- `assistantMessage`（Message）
- `citations[]`（引用：文件 + 页码）
- `extractions`（病例字段候选）
- `nextQuestions[]`

### 2.5 病例（Case）
- `GET /doctor/cases?q=&patientId=&page=&pageSize=&sort=&order=&updatedFrom=&updatedTo=`
- `POST /doctor/cases`（从草稿/会话确认写入）
- `GET /doctor/cases/:caseId`
- `PATCH /doctor/cases/:caseId`

字段对齐：
- `MedicalCaseSummary`: `id, patientId, patientName, diagnosis, formulaName, consultationId?, createdAt, updatedAt`
- `MedicalCaseDetails`: `symptoms, formulaDetail, usageNote, note?`

### 2.6 患者（Patient）
- `GET /doctor/patients?q=&page=&pageSize=&sort=&order=&updatedFrom=&updatedTo=`
- `POST /doctor/patients`
- `GET /doctor/patients/:patientId`
- `PATCH /doctor/patients/:patientId`

字段对齐：
- `id, name, gender?, age?, birthday?, region?, phone?, email?, note?, doctorName?, createdAt, updatedAt`

### 2.7 统计（Admin）
- `GET /admin/stats/cases?q=&doctorId=&patientName=&diagnosis=&formulaName=&page=&pageSize=&sort=updatedAt&order=&updatedFrom=&updatedTo=`
- `GET /admin/stats/consultations?q=&doctorId=&patientName=&hasCase=&page=&pageSize=&sort=updatedAt&order=&updatedFrom=&updatedTo=`
- `GET /admin/stats/patients?q=&doctorId=&region=&page=&pageSize=&sort=updatedAt&order=&updatedFrom=&updatedTo=`
- `GET /admin/stats/doctors?q=&org=&region=&status=&page=&pageSize=&sort=updatedAt&order=&updatedFrom=&updatedTo=`

### 2.8 结构化知识目录（补充）
前端医生端展示结构化目录，需新增接口：
- `GET /catalog` 或 `GET /doctor/catalog`

字段对齐（`CatalogEntry`）：
- `id, name, category(disease|syndrome|symptom|formula), description, linkedTo?`

### 2.9 审计日志（可选）
- `GET /admin/audits`（前端 mock 有数据，但当前页面未使用）

## 3. 通用约束与规范

### 3.1 权限与限制
- 管理端查看问诊必须只读，禁止发送消息。
- 不允许封禁当前登录用户。
- 不允许封禁最后一个启用的管理员账号。

### 3.2 统一分页/排序/检索规范
- 分页：`page`（1-based），`pageSize`
- 排序：`sort` + `order`（默认 `updatedAt desc`）
- 时间范围：`updatedFrom`, `updatedTo`（ISO8601）
- 模糊检索统一使用 `q`
- 列表返回统一：`items`, `total`, `page`, `pageSize`

### 3.3 错误格式建议
- HTTP 状态码语义化（400/401/403/404/409/422/500）
- 返回体统一：`code`, `message`, `details?`

## 4. 引用与预览
- 引用仅支持页码级定位：`Citation` 必须包含 `fileId, fileName, page`。
- 预览依赖 `viewUrl` + `fileType`：前端会对 pdf 拼接 `#page=`，对 doc/docx 使用 Office Viewer。

