# scripts/

官网运维脚本。**改了数据源或依赖后，先跑对应脚本再提交**，不要手工改生成物。

## gen_licenses.py — 生成「第三方开源组件许可」页

从上游仓库 `hermes-rs-ides/crates/hermes-webui/LICENSES/` 读取 12 份许可证全文，
生成 `docs/zh/licenses.md` + `docs/en/licenses.md`（mkdocs 折叠块承载全文）。

```bash
python scripts/gen_licenses.py            # 用内置默认路径生成
python scripts/gen_licenses.py --check    # 只校验数据源完整
```

**何时要跑**：依赖变更导致许可证集合变化时（跑 `cargo metadata` 看 license 分布）。

## inject_beian.py — 备案号注入

官网首页 `docs/index.html` / `index-en.html` 是**原样 copy** 的静态文件，不走 mkdocs
模板（文档页走 `overrides/partials/copyright.html` 自动注入）。首页备案号靠
`<!--BEIAN_INJECT-->` 占位符，**必须在构建之后、部署之前**注入。

```bash
python scripts/inject_beian.py site --beian 粤ICP备2026129410号   # 注入
python scripts/inject_beian.py site --beian ""                    # 清占位符（海外站）
python scripts/inject_beian.py site --check                       # 部署前自检
```

> ⚠️ 这一步漏做会把线上备案号变成裸露的 HTML 注释（**曾真实发生过**）。
> 部署请走下面的 `deploy_volcano.sh`，它已把这步固化进流程。

## deploy_volcano.sh — 火山站（digitego.cn）一键部署

```bash
bash scripts/deploy_volcano.sh              # 完整部署
bash scripts/deploy_volcano.sh --dry-run    # 只构建+自检，不碰服务器
bash scripts/deploy_volcano.sh --skip-build # 复用当前 site/ 产物快速重传
```

流程：生产构建 → 注入备案号 → 部署前自检 → 远端备份 → 上传临时目录 →
校验文件数 → 原子切换（`mv`，nginx 无 404 窗口）→ 公网验证 → 清理。

**回滚**：每次部署前远端留 `<远端根>/site-backup-<时间戳>.tgz`，用
`ssh <host> 'cd <远端根> && rm -rf site && tar xzf site-backup-<TS>.tgz'` 恢复。

**配置**：服务器地址 / 远端路径等环境信息**不入库**（本仓库公开）。
首次使用先 `cp deploy.local.env.example deploy.local.env` 并填写；也可直接用
环境变量覆盖（`HOST=... REMOTE_ROOT=... bash scripts/deploy_volcano.sh`）。

**海外站（GitHub Pages）**另走 `uv run mkdocs gh-deploy --clean`，
注意它会重新构建并**跳过**备案号注入步骤（海外站无需备案号，占位符以注释形式留存，不可见）。
