# med-web 前端（医生端 + 管理端）

基于 Vite + React + TypeScript + Tailwind 的问诊系统前端骨架，覆盖医生端工作台和管理端控制台，围绕“结构化问诊 + 规则优先问诊，模型兜底”场景搭建。包含导航布局、路由、后端 API 查询层、React Query 状态管理，以及登录/问诊/病症/患者的功能页。

## 技术栈
- React 19 + TypeScript + React Router 7
- TailwindCSS（定制浅色主题、玻璃态卡片）
- React Query（数据查询与缓存）
- zod/yup 预留位（表单校验），Ant/Tailwind 友好样式

## 目录结构
- `src/router.tsx`：医生端/管理端路由与入口
- `src/layouts/*`：DoctorLayout（左侧导航、聊天工作台）、AdminLayout（标签导航）
- `src/pages/doctor/*`：问诊列表、详情工作台、知识库、修改密码
- `src/pages/admin/*`：用户管理、病症管理、数据统计
- `src/components/*`：卡片、徽标、聊天消息、患者摘要、建议面板、工作台组合
- `src/api/backendApi.ts` + `src/api/queries.ts`：后端接口封装 + React Query hooks
- `src/types.ts`：角色、问诊、建议等类型定义

## 开发与构建
```bash
npm install
npm run dev    # 启动本地开发（默认端口 5174）
npm run build  # TS 检查 + 生产构建
```

## 登录入口
- 医生端：`/doctor/login`（根目录 `/` 与 `/login` 默认跳转到这里）
- 管理端：`/admin/login`

## 后续对接提示
- 管理端表单可接入 zod/yup 校验 + 抽屉式 CRUD。
- 医生端工作台补充消息发送/采纳流转，模型补充内容标记来源。
