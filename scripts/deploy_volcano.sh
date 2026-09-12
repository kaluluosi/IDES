#!/usr/bin/env bash
#
# IDES 官网（火山站 digitego.cn）一键部署
# =======================================
#
# 把 mkdocs 构建产物部署到火山服务器，流程全部脚本化，杜绝隐式手工步骤：
#
#   1. 生产构建（SITE_URL + ICP_BEIAN 环境变量注入）
#   2. 注入备案号到静态首页的 <!--BEIAN_INJECT--> 占位符   ← 曾因手工漏做导致线上回归
#   3. 部署前自检（占位符必须已全部替换）
#   4. 远端备份当前站点
#   5. 上传到远端临时目录（不直接覆盖线上）
#   6. 校验产物完整性（文件数）
#   7. 原子切换（mv，nginx 无 404 窗口）
#   8. 公网验证（状态码 + 备案号 + 占位符残留）
#   9. 清理临时目录
#
# 用法
# ----
#   bash scripts/deploy_volcano.sh                 # 完整部署
#   bash scripts/deploy_volcano.sh --dry-run       # 只构建+自检+校验，不碰服务器
#   bash scripts/deploy_volcano.sh --skip-build    # 复用当前 site/ 产物（快速重传）
#
# 配置
# ----
#   服务器地址 / 远端路径等环境信息**不入库**（本仓库公开）。
#   先 `cp deploy.local.env.example deploy.local.env` 并填写，脚本会自动加载。
#   也可直接用环境变量覆盖：HOST=user@x.x.x.x REMOTE_ROOT=/opt/x bash scripts/...
#
# 回滚
# ----
#   脚本每次部署前会在远端留 `<远端根>/site-backup-<时间戳>.tgz`。
#   回滚：ssh <host> 'cd <远端根> && rm -rf site && tar xzf site-backup-<TS>.tgz'
#
set -euo pipefail

# ---------- 内部 ----------
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# ---------- 配置加载 ----------
# 本仓库是**公开仓库**，服务器地址 / 路径等环境信息不入库。
# 配置来源优先级：环境变量 > deploy.local.env > 本文件下方默认值。
# 部署前先 cp deploy.local.env.example deploy.local.env 并填好（该文件已 gitignore）。
if [ -f "$REPO_ROOT/deploy.local.env" ]; then
  # shellcheck disable=SC1091
  set -a; . "$REPO_ROOT/deploy.local.env"; set +a
fi

# 必需的本地配置（无默认值，缺失即中止）
HOST="${HOST:-}"
REMOTE_ROOT="${REMOTE_ROOT:-}"

# 非敏感默认值（域名 / 备案号本身是公开信息）
SITE_URL="${SITE_URL:-https://digitego.cn/}"
ICP_BEIAN="${ICP_BEIAN:-粤ICP备2026129410号}"
SITE_DIR="${SITE_DIR:-site}"
VERIFY_URL="${VERIFY_URL:-$SITE_URL}"

DRY_RUN=0
SKIP_BUILD=0
for arg in "$@"; do
  case "$arg" in
    --dry-run)    DRY_RUN=1 ;;
    --skip-build) SKIP_BUILD=1 ;;
    -h|--help)    sed -n '2,40p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "未知参数：$arg（-h 看用法）" >&2; exit 2 ;;
  esac
done

miss=()
[ -n "$HOST" ]        || miss+=("HOST（如 user@1.2.3.4）")
[ -n "$REMOTE_ROOT" ] || miss+=("REMOTE_ROOT（站点根目录绝对路径）")

log()  { printf '\n\033[1;36m▶ %s\033[0m\n' "$*"; }
ok()   { printf '  \033[32m✓\033[0m %s\n' "$*"; }
warn() { printf '  \033[33m!\033[0m %s\n' "$*"; }
die()  { printf '\n\033[1;31m✗ %s\033[0m\n' "$*" >&2; exit 1; }

if [ "${#miss[@]}" -gt 0 ]; then
  die "缺少必需的部署配置：$(IFS=', '; echo "${miss[*]}")。
   请 cp deploy.local.env.example deploy.local.env 并填写（该文件不入库）。"
fi

ssh_() { ssh -o ConnectTimeout=10 "$HOST" "$@"; }

# ---------- 1. 构建 ----------
if [ "$SKIP_BUILD" -eq 0 ]; then
  log "1/9 生产构建（SITE_URL=$SITE_URL）"
  SITE_URL="$SITE_URL" ICP_BEIAN="$ICP_BEIAN" uv run mkdocs build --clean >/tmp/mkdocs-build.log 2>&1 \
    || { tail -20 /tmp/mkdocs-build.log; die "mkdocs build 失败，详见 /tmp/mkdocs-build.log"; }
  ok "构建完成（$(grep -c . /tmp/mkdocs-build.log) 行日志）"

  # canonical 必须指向生产域名
  if ! grep -q "href=\"${SITE_URL}" "$SITE_DIR/licenses/index.html" 2>/dev/null; then
    grep -o '<link rel="canonical" href="[^"]*"' "$SITE_DIR/licenses/index.html" | head -1 || true
    warn "canonical 未匹配 $SITE_URL，请确认 SITE_URL 注入生效"
  else
    ok "canonical 指向 $SITE_URL"
  fi
else
  log "1/9 跳过构建（--skip-build）"
fi

[ -f "$SITE_DIR/index.html" ] || die "$SITE_DIR/ 不存在或无 index.html，先跑一次完整构建"

# ---------- 2. 注入备案号 ----------
log "2/9 注入备案号到静态首页占位符"
python scripts/inject_beian.py "$SITE_DIR" --beian "$ICP_BEIAN"

# ---------- 3. 部署前自检 ----------
log "3/9 部署前自检（占位符必须已全部替换）"
python scripts/inject_beian.py "$SITE_DIR" --check || die "仍有未替换的占位符，中止部署"

LOCAL_FILES=$(find "$SITE_DIR" -type f | wc -l | tr -d ' ')
ok "本地产物：$LOCAL_FILES 个文件，$(du -sh "$SITE_DIR" | cut -f1)"

if [ "$DRY_RUN" -eq 1 ]; then
  log "dry-run：以下步骤被跳过（备份 / 上传 / 切换 / 验证）"
  echo "  将部署到 $HOST:$REMOTE_ROOT/site"
  echo "  验证地址 $VERIFY_URL"
  exit 0
fi

# ---------- 4. 远端备份 ----------
log "4/9 远端备份当前站点"
BACKUP=$(ssh_ "TS=\$(date +%Y%m%d-%H%M%S); echo \"site-backup-\$TS.tgz\"")
ssh_ "set -e; [ -d '$REMOTE_ROOT/site' ] && tar czf '$REMOTE_ROOT/$BACKUP' -C '$REMOTE_ROOT' site && echo \"  \$(du -h '$REMOTE_ROOT/$BACKUP' | cut -f1)\" || echo '（无既有 site，跳过备份）'"
ok "备份：$REMOTE_ROOT/$BACKUP"

# ---------- 5. 上传到临时目录 ----------
log "5/9 上传到远端临时目录"
ssh_ "rm -rf '$REMOTE_ROOT/site.new'; mkdir -p '$REMOTE_ROOT/site.new'"
tar czf - -C "$SITE_DIR" . | ssh_ "tar xzf - -C '$REMOTE_ROOT/site.new'"
ok "上传完成"

# ---------- 6. 校验 ----------
log "6/9 校验远端产物完整性"
REMOTE_FILES=$(ssh_ "find '$REMOTE_ROOT/site.new' -type f | wc -l" | tr -d ' \r')
if [ "$LOCAL_FILES" != "$REMOTE_FILES" ]; then
  die "文件数不一致（本地 $LOCAL_FILES / 远端 $REMOTE_FILES），中止切换。远端临时目录保留在 $REMOTE_ROOT/site.new 供排查"
fi
ok "文件数一致：$REMOTE_FILES"

# ---------- 7. 原子切换 ----------
log "7/9 原子切换"
ssh_ "set -e; cd '$REMOTE_ROOT'; rm -rf site.old; mv site site.old 2>/dev/null || true; mv site.new site; rm -rf site.old"
ok "切换完成（旧产物已清理）"

# ---------- 8. 公网验证 ----------
log "8/9 公网验证"
sleep 2
python - "$VERIFY_URL" "$ICP_BEIAN" <<'PY'
import sys, urllib.request
base, beian = sys.argv[1].rstrip('/') + '/', sys.argv[2]
def get(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'ides-deploy-check'})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.status, r.read().decode('utf-8', 'replace')
checks = [("首页", base), ("许可页 zh", base + 'licenses/'), ("许可页 en", base + 'en/licenses/')]
fail = 0
for name, url in checks:
    try:
        status, html = get(url)
        stale = 'BEIAN_INJECT' in html
        has_beian = beian in html
        flag = '✓' if status == 200 and not stale else '✗'
        if flag == '✗': fail += 1
        print(f"  {flag} {name:10s} {status}  备案号={'有' if has_beian else '无'}  占位符残留={'有' if stale else '无'}")
    except Exception as e:
        fail += 1
        print(f"  ✗ {name:10s} 请求失败：{e}")
sys.exit(1 if fail else 0)
PY
ok "公网验证通过"

# ---------- 9. 收尾 ----------
log "9/9 收尾"
ssh_ "ls -lah '$REMOTE_ROOT' | tail -5"
printf '\n\033[1;32m部署成功\033[0m  %s\n' "$VERIFY_URL"
printf '回滚点：%s:%s/%s\n' "$HOST" "$REMOTE_ROOT" "$BACKUP"
