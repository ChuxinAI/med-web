# Aliyun 部署文档（yum）

本项目为 Vite + React SPA，生产产物为 `dist/` 静态文件。

## 本地构建概览
- 运行时：Node.js（未固定版本，建议使用 Node 20 LTS）。
- 构建命令：`npm run build`（或 `npm run build:online` / `npm run build:sandbox`）。
- 产物目录：`dist/`。
- API Base：`VITE_API_BASE_URL` 在 `.env.*` 中配置，构建时写入。

## 部署方式
1) 本地构建，上传 `dist/` 到服务器（最简单，服务器无需 Node.js）。
2) 服务器构建（需要在服务器安装 Node.js + npm）。

## 服务器准备（yum）
CentOS/RHEL/AlmaLinux 示例。

```bash
sudo yum -y update
sudo yum -y install nginx
sudo systemctl enable --now nginx
```

### 可选：安装 Node.js（仅当服务器构建时需要）
使用 NodeSource（推荐较新版本）：

```bash
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum -y install nodejs
node -v
npm -v
```

## 服务器构建并部署（含 GitHub 拉取）
服务器可访问 GitHub，使用 SSH 克隆仓库。

### 1) 准备 SSH Key（若尚未配置）
```bash
ssh-keygen -t ed25519 -C "deploy@med-web"
cat ~/.ssh/id_ed25519.pub
```
将公钥添加到 GitHub 的 Deploy Key 或账号 SSH Keys。

### 2) 克隆仓库
```bash
mkdir -p /home/work/med
cd /home/work/med
git clone git@github.com:ChuxinAI/med-web.git
cd med-web
```

### 3) 安装依赖并构建
```bash
npm install
npm run build:online
```

### 4) 部署静态文件
```bash
sudo mkdir -p /home/work/med/site
sudo rsync -a --delete dist/ /home/work/med/site/
```

## 本地构建并上传（可选）
```bash
npm install
npm run build:online
```
将 `dist/` 上传到服务器，例如 `/home/work/med/site/`。

## 直接启动（无需 Nginx）
```bash
npx serve -s /home/work/med/site -l 5174
```

## 环境说明
- `VITE_API_BASE_URL` 在构建时写入。
- 不同环境使用 `npm run build:sandbox` 或 `npm run build:online`。
- 若 API 地址变化，需要重新构建并部署 `dist/`。

## 健康检查
- 访问 `http://your.domain.com`。
- 打开 DevTools，确认 API 请求指向预期地址。

## 常见问题
- 刷新 404：确认 Nginx 中 `try_files ... /index.html` 已配置。
- 白屏：检查构建时 API base 与后端 CORS。
- 权限：如有需要执行 `sudo chown -R $USER:$USER /home/work/med/site`。
