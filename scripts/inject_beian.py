# -*- coding: utf-8 -*-
"""把备案号注入官网静态首页的 <!--BEIAN_INJECT--> 占位符。

背景
----
官网首页 docs/index.html / index-en.html 是**原样 copy** 的静态文件，不走 mkdocs
模板渲染（文档页走 overrides/partials/copyright.html 自动注入）。因此官网首页
的备案号必须在**构建之后、部署之前**由部署流程注入——这是必须脚本化的一步，
漏掉就会把线上备案号变成裸露的占位符注释。

用法
----
    # 注入（国内站）
    python scripts/inject_beian.py site --beian 粤ICP备2026129410号

    # 清除占位符（海外站不想留注释）
    python scripts/inject_beian.py site --beian ""

    # 只检查不修改（CI / 部署前自检）
    python scripts/inject_beian.py site --check
"""
import argparse
import pathlib
import sys

PLACEHOLDER = "<!--BEIAN_INJECT-->"
DEFAULT_LINK = "https://beian.miit.gov.cn"
# 与历史线上产物保持一致的缩进与结构，杜绝逐字节漂移
INDENT = "    "


def inject(path: pathlib.Path, beian: str, link: str) -> bool:
    """返回 True 表示文件被改写。"""
    # newline="" 保留原始行尾（CRLF/LF）——用 read_text() 默认会做 universal
    # newlines 归一化，把 CRLF 静默变成 LF，产物与历史版本逐字节不可比。
    with open(path, "r", encoding="utf-8", newline="") as fh:
        raw = fh.read()
    if PLACEHOLDER not in raw:
        return False
    if beian:
        repl = '%s<div class="footer-beian"><a href="%s" target="_blank" rel="noopener">%s</a></div>' % (
            INDENT, link, beian)
    else:
        repl = ""  # 海外站：清掉占位符，不留注释
    lines = raw.splitlines(keepends=True)
    out = []
    for line in lines:
        if PLACEHOLDER in line:
            if repl:
                # 保留原行尾（CRLF/LF）
                eol = "\r\n" if line.endswith("\r\n") else "\n"
                out.append(repl + eol)
            # beian 为空 → 整行删除
        else:
            out.append(line)
    with open(path, "w", encoding="utf-8", newline="") as fh:
        fh.write("".join(out))
    return True


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("site_dir", help="mkdocs 构建产物目录（含 index.html）")
    ap.add_argument("--beian", default="", help="备案号；留空则删除占位符")
    ap.add_argument("--link", default=DEFAULT_LINK, help="工信部备案链接")
    ap.add_argument("--check", action="store_true",
                    help="只检查占位符是否残留（残留即有未注入的页面）")
    args = ap.parse_args()

    root = pathlib.Path(args.site_dir)
    if not root.is_dir():
        print("目录不存在：%s" % root, file=sys.stderr)
        return 1

    targets = sorted(p for p in root.glob("*.html"))
    if args.check:
        stale = [p for p in targets if PLACEHOLDER in p.read_text(encoding="utf-8")]
        if stale:
            print("⚠️  以下文件仍有未替换的占位符：", file=sys.stderr)
            for p in stale:
                print("    %s" % p, file=sys.stderr)
            return 1
        print("✅ 无占位符残留（%d 个顶层 html 已检查）" % len(targets))
        return 0

    changed = [p for p in targets if inject(p, args.beian, args.link)]
    if not changed:
        print("（无占位符，跳过）")
    for p in changed:
        print("已注入：%s" % p)
    return 0


if __name__ == "__main__":
    sys.exit(main())
