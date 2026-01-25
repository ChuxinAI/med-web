# Aliyun 部署文档（可执行脚本）

本项目为 Vite + React SPA，生产产物为 `dist/` 静态文件。提供一键式脚本完成系统镜像切换、依赖安装、构建与部署。

## 使用方式
```bash
bash scripts/deploy-aliyun.sh \
  --repo git@github.com:ChuxinAI/med-web.git \
  --branch main \
  --mode online \
  --domain your.domain.com \
  --api-base http://your-api.example.com
```

## 参数说明
- `--repo`：Git 仓库地址（SSH/HTTPS）
- `--branch`：分支名（默认 `main`）
- `--mode`：构建模式（`online` / `sandbox` / `prod`，默认 `online`）
- `--domain`：Nginx server_name（默认 `_`）
- `--api-base`：写入 `.env.<mode>` 的 API base（可选）
- `--root`：部署根目录（默认 `/home/work/med`）

## 说明
- 脚本会自动判断系统（yum/dnf/apt）并切换到阿里云镜像源。
- 脚本默认使用 NVM 安装 Node 20，并配置 npm 国内镜像。
- 部署目录与源码目录分离，避免误删源码。
