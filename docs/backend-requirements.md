# med 后端需求说明（REST）

本文档用于指导后端从零设计接口与数据模型，以满足现有前端（医生端 + 管理端）的业务诉求。前端约束：知识引用仅精确到“页码”；方剂详情为纯文本；医生端一次只处理一个问诊会话；管理端可查看问诊对话但不允许继续对话。

## 1. 目标与范围

- **核心功能**：医生端问诊（对话式引导补齐病例要素）→ 形成治疗建议与最终方剂；并管理患者、病例、问诊记录。
- **管理端**：用户管理、知识库文件管理与检索、跨医生的数据统计与审阅（只读对话）。
- **知识数据**：以文件为单位管理，上传到阿里云知识库并通过 RAG 检索；系统返回片段时必须携带**页码**以支持前端定位原文。

## 2. 角色与权限

- `admin`：用户管理、知识管理、统计分析、只读查看任意医生的问诊/病例/患者数据。
- `doctor`：仅访问本账号相关的患者/病例/问诊；可继续对话；可保存草稿并确认写入病例。

权限关键规则（后端必须强校验）：
- 不允许封禁当前登录的自己。
- 不允许封禁最后一个处于激活状态的管理员账号。
- 管理端查看问诊消息为只读：禁止 `POST` 发送消息。

## 3. 通用接口规范（建议）

### 3.1 认证

- Header：`Authorization: Bearer <accessToken>`
- Token 失效使用 `POST /auth/refresh` 刷新（可选 refresh token 机制）。

### 3.2 分页 / 排序 / 时间筛选

- 分页：`page`（1-based）、`pageSize`
- 排序：`sort=updatedAt|createdAt|...`，`order=asc|desc`（默认 `updatedAt desc`）
- 时间范围（默认用于 `updatedAt`）：`updatedFrom`、`updatedTo`（ISO8601）
- 统一列表返回：
  - `items: T[]`
  - `total: number`
  - `page: number`
  - `pageSize: number`

### 3.3 模糊检索

- 统一使用 `q`；各资源决定匹配字段（如用户名/姓名/电话/邮箱等）。

### 3.4 错误格式（建议）

- HTTP 状态码语义化（400/401/403/404/409/422/500）
- Body 统一：
  - `code: string`
  - `message: string`
  - `details?: unknown`

## 4. 数据模型（最小字段建议）

> 所有资源建议具备 `createdAt`、`updatedAt`（ISO8601）。

### 4.1 User（管理员/医生）

- `id`
- `role`: `admin | doctor`
- `username`（登录名/展示名，支持模糊检索）
- `org`（单位）
- `realName`
- `region`
- `phone`
- `email`
- `note`
- `status`: `active | banned`
- `registeredAt`（可与 `createdAt` 合并）
- `lastLoginAt`
- `registerIp`
- `lastLoginIp`

### 4.2 Patient（患者）

- `id`
- `doctorId`（所属医生）
- `name`
- `age`（可选）
- `birthday`（可选）
- `region`
- `phone`
- `email`
- `note`

### 4.3 Consultation（问诊会话）

- `id`
- `doctorId`
- `patientId?`（可为空：未建患者/临时问诊）
- `status`: `open | closed`
- `hasCase`: boolean（是否已生成病例）
- `startedAt`（建议 = createdAt）

### 4.4 Message（问诊消息）

- `id`
- `consultationId`
- `sender`: `doctor | system | model | patientinfo`
- `content`（纯文本）
- `source`: `rule | rag | model`（可选：用于标注“规则/库内/模型兜底”）
- `createdAt`
- `citations?`: `Citation[]`

`Citation`（仅页码粒度）：
- `fileId`
- `fileName`
- `page`（number）

### 4.5 Case（病例）

- `id`
- `doctorId`
- `patientId`
- `consultationId?`（可选：来源会话）
- `symptoms`（纯文本）
- `diagnosis`（纯文本：疾病/分型/症候合并表达）
- `formulaName`
- `formulaDetail`（纯文本）
- `usageNote`（纯文本：用法用量/备注）
- `citations?`: `Citation[]`（可用于病例层面的可追溯）

### 4.6 KnowledgeFile（知识库文件）

- `id`
- `fileName`
- `fileType`
- `fileSize`
- `status`: `processing | ready | failed`
- `uploadedAt`（可与 createdAt 合并）
- `updatedAt`
- `pdfUrl?`（若后端统一转 PDF 并提供预览）

### 4.7 KnowledgeSearchHit（全库片段检索结果）

- `fileId`
- `fileName`
- `page`
- `snippet`（片段文本，前端负责高亮）
- `score?`（相似度/置信度）

## 5. 关键业务流程与规则

### 5.1 医生端问诊（对话驱动结构化病例构建）

前端需要后端在“回复消息”时尽量同时返回：
- 可展示的 `assistantMessage`（Message）
- `citations[]`（引用原文：文件 + 页码）
- `extractions`：对病例字段的候选/建议（用于右侧结构化面板）
- `nextQuestions[]`：用于引导补齐字段的下一步追问

字段优先级（用于引导补齐）：患者信息 → 症状 → 诊断结果 → 方剂名 → 方剂详情 → 用法用量/备注。

### 5.2 问诊记录不一定生成病例

- 会话可以长期存在；只有医生点击“确认写入病例”才生成 Case。
- 支持保存会话草稿（右侧面板字段）与更新。

### 5.3 知识库管理（无版本，删除后再上传）

- 上传：创建文件记录并触发阿里云入库任务；状态从 `processing` → `ready|failed`。
- 删除：删除文件记录并触发阿里云侧对应清理（如需）。
- 检索：全库检索返回片段 + 页码，保证可定位。

## 6. REST API 清单（建议）

### 6.1 Auth / Me

- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /me`
- `PATCH /me`
- `POST /me/password`

### 6.2 Admin｜用户管理

- `GET /admin/users?q=&role=&status=&page=&pageSize=&sort=&order=&updatedFrom=&updatedTo=`
- `POST /admin/users`
- `GET /admin/users/:userId`
- `PATCH /admin/users/:userId`
- `POST /admin/users/:userId/ban`
- `POST /admin/users/:userId/unban`
- `POST /admin/users/:userId/reset-password`

### 6.3 Admin｜知识管理（文件 + 全库检索 + 原文预览）

- `GET /admin/knowledge/files?q=&page=&pageSize=&sort=updatedAt|createdAt&order=`
- `POST /admin/knowledge/files`（multipart）
- `DELETE /admin/knowledge/files/:fileId`
- `GET /admin/knowledge/search?query=&page=&pageSize=`
- `GET /admin/knowledge/files/:fileId/view`（返回 `pdfUrl` 或 302；配合 `page` 使用）

### 6.4 Doctor｜患者

- `GET /doctor/patients?q=&page=&pageSize=&sort=&order=&updatedFrom=&updatedTo=`
- `POST /doctor/patients`
- `GET /doctor/patients/:patientId`
- `PATCH /doctor/patients/:patientId`

### 6.5 Doctor｜问诊（单会话）

- `GET /doctor/consultations?q=&patientId=&page=&pageSize=&sort=&order=&updatedFrom=&updatedTo=`
- `POST /doctor/consultations`（可选携带 `patientId` 以“从患者发起问诊”）
- `GET /doctor/consultations/:consultationId`
- `GET /doctor/consultations/:consultationId/messages?page=&pageSize=`
- `POST /doctor/consultations/:consultationId/messages`
- `PATCH /doctor/consultations/:consultationId/draft`（保存结构化草稿）
- `POST /doctor/consultations/:consultationId/close`（可选）

### 6.6 Doctor｜病例

- `GET /doctor/cases?q=&patientId=&page=&pageSize=&sort=&order=&updatedFrom=&updatedTo=`
- `POST /doctor/cases`（从草稿/会话确认写入）
- `GET /doctor/cases/:caseId`
- `PATCH /doctor/cases/:caseId`（是否允许生成后编辑由业务决定）

### 6.7 Admin｜数据统计（默认用于 `updatedAt` 筛选）

- `GET /admin/stats/cases?q=&doctorId=&patientName=&diagnosis=&formulaName=&page=&pageSize=&sort=updatedAt&order=&updatedFrom=&updatedTo=`
- `GET /admin/stats/consultations?q=&doctorId=&patientName=&hasCase=&page=&pageSize=&sort=updatedAt&order=&updatedFrom=&updatedTo=`
- `GET /admin/stats/patients?q=&doctorId=&region=&page=&pageSize=&sort=updatedAt&order=&updatedFrom=&updatedTo=`
- `GET /admin/stats/doctors?q=&org=&region=&status=&page=&pageSize=&sort=updatedAt&order=&updatedFrom=&updatedTo=`

管理端只读对话：
- `GET /admin/consultations/:consultationId/messages?page=&pageSize=`

## 7. 结构化建议（extractions）返回格式（建议）

用于支持前端右侧“病例构建器”的候选/确认交互，建议后端返回类似：

- `extractions.patient`：`{ name?, age?, birthday?, region?, phone?, email?, note?, source, confidence?, citations? }`
- `extractions.symptoms`：`{ text?, candidates?: string[], source, confidence?, citations? }`
- `extractions.diagnosis`：`{ text?, candidates?: string[], source, confidence?, citations? }`
- `extractions.formula`：`{ name?, candidates?: string[], detail?, usageNote?, source, confidence?, citations? }`
- `nextQuestions: string[]`

其中 `citations` 的粒度仅到页码（`fileName + page`），以符合前端约束。

