#!/usr/bin/env bash
# 一键部署脚本：适用于阿里云服务器，自动安装依赖并部署前端静态站点
# 使用前请确保当前用户有 sudo 权限，且服务器可以访问 Git 仓库
set -euo pipefail

REPO=""
BRANCH="main"
MODE="online"
DOMAIN="_"
API_BASE=""
ROOT_DIR="/home/work/med"
SITE_DIR=""
SRC_DIR=""

usage() {
  # 帮助说明：展示脚本用法与参数
  cat <<'EOF'
Usage:
  bash scripts/deploy-aliyun.sh --repo <git-url> [options]

Options:
  --repo      Git repo URL (required)
  --branch    Git branch (default: main)
  --mode      Build mode: online|sandbox|prod (default: online)
  --domain    Nginx server_name (default: _)
  --api-base  VITE_API_BASE_URL (optional)
  --root      Deploy root (default: /home/work/med)
EOF
}

while [[ $# -gt 0 ]]; do
  # 解析命令行参数
  case "$1" in
    --repo) REPO="$2"; shift 2 ;;
    --branch) BRANCH="$2"; shift 2 ;;
    --mode) MODE="$2"; shift 2 ;;
    --domain) DOMAIN="$2"; shift 2 ;;
    --api-base) API_BASE="$2"; shift 2 ;;
    --root) ROOT_DIR="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $1"; usage; exit 1 ;;
  esac
done

if [[ -z "$REPO" ]]; then
  # 必填参数校验：没有 repo 就无法拉取代码
  echo "Missing --repo"
  usage
  exit 1
fi

SITE_DIR="${ROOT_DIR}/site"
SRC_DIR="${ROOT_DIR}/src"

detect_pkg_manager() {
  # 判断系统使用的包管理器：yum/dnf/apt
  if command -v dnf >/dev/null 2>&1; then
    echo "dnf"
  elif command -v yum >/dev/null 2>&1; then
    echo "yum"
  elif command -v apt-get >/dev/null 2>&1; then
    echo "apt"
  else
    echo ""
  fi
}

switch_mirror_yum() {
  # CentOS/RHEL 系列：切换到阿里云镜像源
  sudo sed -i 's|^mirrorlist=|#mirrorlist=|g' /etc/yum.repos.d/*.repo || true
  sudo sed -i 's|^#baseurl=http://mirror.centos.org|baseurl=http://mirrors.aliyun.com|g' /etc/yum.repos.d/*.repo || true
  sudo yum makecache || true
}

switch_mirror_apt() {
  # Ubuntu/Debian 系列：切换到阿里云镜像源
  sudo sed -i 's|http://.*.ubuntu.com|http://mirrors.aliyun.com|g' /etc/apt/sources.list || true
  sudo apt-get update -y
}

install_base_packages() {
  # 安装 Git 与 Nginx，并启动 Nginx 服务
  local mgr="$1"
  if [[ "$mgr" == "yum" || "$mgr" == "dnf" ]]; then
    sudo "$mgr" -y install git nginx
  elif [[ "$mgr" == "apt" ]]; then
    sudo apt-get -y install git nginx
  else
    echo "No supported package manager found."
    exit 1
  fi
  sudo systemctl enable --now nginx
}

install_nvm_node() {
  # 安装 nvm 与 Node.js 20，并配置 npm 国内镜像
  export NVM_NODEJS_ORG_MIRROR=https://npmmirror.com/mirrors/node
  if [[ ! -s "$HOME/.nvm/nvm.sh" ]]; then
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  fi
  # shellcheck disable=SC1090
  source "$HOME/.nvm/nvm.sh"
  nvm install 20
  nvm use 20
  npm config set registry https://registry.npmmirror.com
}

ensure_repo() {
  # 拉取或更新仓库代码
  mkdir -p "$ROOT_DIR"
  if [[ -d "$SRC_DIR/.git" ]]; then
    git -C "$SRC_DIR" fetch --all
    git -C "$SRC_DIR" checkout "$BRANCH"
    git -C "$SRC_DIR" pull --ff-only
  else
    git clone "$REPO" "$SRC_DIR"
    git -C "$SRC_DIR" checkout "$BRANCH"
  fi
}

write_env() {
  # 写入环境变量文件（可选）：用来设置 API 地址
  if [[ -n "$API_BASE" ]]; then
    local env_file="$SRC_DIR/.env.${MODE}"
    printf "VITE_API_BASE_URL=%s\n" "$API_BASE" > "$env_file"
  fi
}

build_project() {
  # 安装依赖并构建项目
  # shellcheck disable=SC1090
  source "$HOME/.nvm/nvm.sh"
  cd "$SRC_DIR"
  npm install
  if [[ "$MODE" == "prod" ]]; then
    npm run build
  else
    npm run "build:${MODE}"
  fi
}

deploy_dist() {
  # 将构建产物部署到站点目录
  sudo mkdir -p "$SITE_DIR"
  sudo rsync -a --delete "$SRC_DIR/dist/" "$SITE_DIR/"
}

configure_nginx() {
  # 写入 Nginx 配置并重载服务
  local conf="/etc/nginx/conf.d/med-web.conf"
  sudo tee "$conf" >/dev/null <<EOF
server {
  listen 80;
  server_name ${DOMAIN};

  root ${SITE_DIR};
  index index.html;

  location / {
    try_files \$uri \$uri/ /index.html;
  }

  location ~* \\\\.(?:js|css|png|jpg|jpeg|gif|svg|ico|woff2?)$ {
    expires 30d;
    access_log off;
    add_header Cache-Control "public";
  }
}
EOF
  sudo nginx -t
  sudo systemctl reload nginx
}

main() {
  # 主流程：镜像源 -> 依赖安装 -> 拉代码 -> 构建 -> 部署 -> Nginx
  local mgr
  mgr="$(detect_pkg_manager)"
  if [[ "$mgr" == "yum" || "$mgr" == "dnf" ]]; then
    switch_mirror_yum
  elif [[ "$mgr" == "apt" ]]; then
    switch_mirror_apt
  else
    echo "No supported package manager found."
    exit 1
  fi

  install_base_packages "$mgr"
  install_nvm_node
  ensure_repo
  write_env
  build_project
  deploy_dist
  #configure_nginx

  echo "Deploy complete."
}

main
