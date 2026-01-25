# med 后端需求说明（REST）

本文档用于指导后端从零设计接口与数据模型，以满足现有前端（医生端 + 管理端）的业务诉求。前端约束：引用来自病症管理条目；方剂详情为纯文本；医生端一次只处理一个问诊会话；管理端可查看问诊对话但不允许继续对话。

## 1. 目标与范围

- **核心功能**：医生端问诊（对话式引导补齐结构化字段）→ 形成治疗建议与最终方剂；并管理患者、问诊记录。
- **管理端**：用户管理、病症管理、跨医生的数据统计与审阅（只读对话）。

## 2. 角色与权限

- `admin`：用户管理、病症管理、统计分析、只读查看任意医生的问诊/患者数据。
- `doctor`：仅访问本账号相关的患者/问诊；可继续对话；可保存草稿。

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
- `status`: `active | suspended`
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
- `gender`（可选）
- `phone`
- `email`
- `note`

### 4.3 Consultation（问诊会话）

- `id`
- `doctorId`
- `patientId?`（可为空：未建患者/临时问诊）
- `status`: `open | in_review | closed`
- `startedAt`（建议 = createdAt）

### 4.4 Message（问诊消息）

- `id`
- `consultationId`
- `sender`: `doctor | system | model | patientinfo`
- `content`（纯文本）
- `source`: `knowledge-base | model`（可选：用于标注“库内/模型兜底”）
- `createdAt`
- `citations?`: `Citation[]`

`Citation`（病症条目引用）：
- `diseaseId`
- `diseaseName`
（前端仅使用病症管理数据做预览，不使用文件类预览）

### 4.5 Disease（病症管理条目）

- `id`
- `name`
- `type_name`
- `type_code`（`disease | syndrome | symptom`）
- `symptoms`
- `differentiation`
- `formula`
- `note?`

## 5. 关键业务流程与规则

### 5.1 医生端问诊（对话驱动结构化草稿）

前端需要后端在“回复消息”时尽量同时返回：
- 可展示的 `assistantMessage`（Message）
- `citations[]`（引用病症管理条目）
- `extractions`：对病例字段的候选/建议（用于右侧结构化面板）
- `nextQuestions[]`：用于引导补齐字段的下一步追问

字段优先级（用于引导补齐）：患者信息 → 症状 → 诊断结果 → 方剂名 → 备注。

### 5.2 问诊记录草稿

- 会话可以长期存在，支持保存结构化草稿（右侧面板字段）与更新。

## 6. REST API 清单（建议）

### 6.1 Auth / Me

- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `POST /auth/register`
- `GET /auth/me`
- `PATCH /auth/me`
- `POST /auth/me/password`

### 6.2 Admin｜用户管理

- `GET /admin/users?q=&role=&status=&page=&pageSize=&sort=&order=&updatedFrom=&updatedTo=`
- `POST /admin/users`
- `GET /admin/users/:userId`
- `PATCH /admin/users/:userId`
- `POST /admin/users/:userId/ban`
- `POST /admin/users/:userId/unban`
- `POST /admin/users/:userId/reset-password`

### 6.3 Admin｜病症管理

- `GET /admin/diseases?q=&page=&pageSize=&sort=&order=&updatedFrom=&updatedTo=`
- `POST /admin/diseases`
- `PATCH /admin/diseases/:diseaseId`
- `DELETE /admin/diseases/:diseaseId`
- `POST /admin/diseases/import`（Excel 批量导入，multipart）

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
- `POST /doctor/consultations/:consultationId/messages`（SSE）
- `PATCH /doctor/consultations/:consultationId`（保存结构化草稿：`patient_id` / `symptoms` / `disease` / `formula` / `note`）
- `POST /doctor/consultations/:consultationId/close`（可选）
- `POST /doctor/consultations/:consultationId/dialogue/stream`（SSE，`mode=model_decision`）
SSE 约定：
- `delta` 事件返回回复文本片段
- `done` 事件返回结构化建议（建议沿用 `ConsultationSuggestionOut`），候选病症概率在 `done` 统一返回

### 6.6 Admin｜数据统计（默认用于 `updatedAt` 筛选）
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

其中 `citations` 建议包含 `diseaseId / diseaseName`，前端引用预览依赖病症管理数据。
