# med-web 前端（医生端 + 管理端）

基于 Vite + React + TypeScript + Tailwind 的问诊系统前端骨架，覆盖医生端工作台和管理端控制台，围绕“结构化知识库 + 规则优先问诊，向量检索/大模型兜底”场景搭建。包含导航布局、路由、Mock 数据/查询层、React Query 状态管理，以及登录/病例/知识库/审计的演示页。

## 技术栈
- React 19 + TypeScript + React Router 7
- TailwindCSS（定制浅色主题、玻璃态卡片）
- React Query（数据查询与缓存）
- zod/yup 预留位（表单校验），Ant/Tailwind 友好样式

## 目录结构
- `src/router.tsx`：医生端/管理端路由与入口
- `src/layouts/*`：DoctorLayout（左侧导航、聊天工作台）、AdminLayout（标签导航）
- `src/pages/doctor/*`：问诊列表、详情工作台、病例概览、知识库、修改密码
- `src/pages/admin/*`：用户管理、疾病/证型/症状/方剂管理、病例审计、系统审计日志
- `src/components/*`：卡片、徽标、聊天消息、患者摘要、建议面板、工作台组合
- `src/api/mockData.ts`：与需求对齐的 Mock 数据（病例/消息/建议/用户/知识库/审计）
- `src/api/mockApi.ts` + `src/api/queries.ts`：模拟接口 + React Query hooks
- `src/types.ts`：角色、病例、建议、审计等类型定义

## 开发与构建
```bash
npm install
npm run dev    # 启动本地开发
npm run build  # TS 检查 + 生产构建
```

## 后续对接提示
- 将 `mockApi.ts` 替换为真实 FastAPI 接口；在 hooks 中补充鉴权头、错误处理、频控提示。
- 在登录流程接入 JWT access/refresh；结合路由守卫、token 失效刷新、401 退出。
- 管理端表单接入 zod/yup 校验 + 抽屉式 CRUD；提交写入审计日志。
- 医生端工作台补充消息发送/采纳流转，模型补充内容标记来源并存储在病例。
- 向量检索状态可通过单独接口展示（pgvector + BAAI/bge-small-zh-v1.5）。
