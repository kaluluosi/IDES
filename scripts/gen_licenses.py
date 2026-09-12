# -*- coding: utf-8 -*-
"""生成 IDES 官网「第三方开源组件许可」页面（docs/zh/licenses.md + docs/en/licenses.md）。

数据源
------
上游仓库 hermes-rs-ides 的 crates/hermes-webui/LICENSES/（许可证全文 + README 一览表）。
该目录随安装包分发至 IDES_HOME/LICENSES/，是许可证公示义务的唯一事实来源。
本脚本只读取、不修改数据源。

渲染
----
mkdocs-material + pymdownx.details：每份许可证全文放进折叠块（??? quote），
块内用 fenced code block（```text）承载，避免 markdown 误解析正文中的特殊字符。

用法
----
    python scripts/gen_licenses.py                    # 用内置默认路径
    python scripts/gen_licenses.py --src <LICENSES>   # 指定数据源目录
    python scripts/gen_licenses.py --check            # 只校验不改写

依赖变更后（Cargo.toml / license 集合变化）重新跑一次即可。
"""
import argparse
import os
import sys
import textwrap

DEFAULT_SRC = r"C:/Users/kalul/Documents/GitHub/hermes-rs-ides/crates/hermes-webui/LICENSES"
DEFAULT_OUT_ZH = "docs/zh/licenses.md"
DEFAULT_OUT_EN = "docs/en/licenses.md"

# (文件名, 许可证名, zh 说明, en 说明) —— 顺序对齐 LICENSES/README.md 一览表
LICS = [
    ("MPL-2.0.txt",      "MPL-2.0",      "⚠️ 文件级 copyleft，附特殊分发义务（见下）", "File-level copyleft; special distribution obligations (see below)"),
    ("MIT.txt",          "MIT",          "宽松", "Permissive"),
    ("Apache-2.0.txt",   "Apache-2.0",   "宽松", "Permissive"),
    ("BSD-2-Clause.txt", "BSD-2-Clause", "宽松（BSD 家族，两条款）", "Permissive (BSD family, 2-clause)"),
    ("BSD-3-Clause.txt", "BSD-3-Clause", "宽松", "Permissive"),
    ("ISC.txt",          "ISC",          "宽松", "Permissive"),
    ("Zlib.txt",         "Zlib",         "宽松", "Permissive"),
    ("Unicode-3.0.txt",  "Unicode-3.0",  "宽松（Unicode 数据）", "Permissive (Unicode data)"),
    ("CC0-1.0.txt",      "CC0-1.0",      "公有领域", "Public domain"),
    ("Unlicense.txt",    "Unlicense",    "公有领域", "Public domain"),
    ("0BSD.txt",         "0BSD",         "宽松", "Permissive"),
    ("BSL-1.0.txt",      "BSL-1.0",      "宽松（Boost Software License）", "Permissive (Boost Software License)"),
]

# MPL-2.0 义务声明组件（文件级 copyleft，需按 MPL §3.1 提供源码获取方式）
MPL_COMPONENTS = [
    ("colored",          "3.1.1",  "https://github.com/mackwic/colored"),
    ("cssparser",        "0.36.0", "https://github.com/servo/rust-cssparser"),
    ("cssparser-macros", "0.6.1",  "https://github.com/servo/rust-cssparser"),
    ("dtoa-short",       "0.3.5",  "https://github.com/cybergeek94/dtoa-short"),
    ("option-ext",       "0.2.0",  "https://github.com/soc/option-ext"),
    ("selectors",        "0.36.1", "https://github.com/servo/servo"),
]

MPL_URL = "https://www.mozilla.org/en-US/MPL/2.0/"


def read_lic(src, fname):
    path = os.path.join(src, fname)
    if not os.path.isfile(path):
        raise SystemExit("缺少许可证全文文件：%s" % path)
    with open(path, "r", encoding="utf-8") as fh:
        text = fh.read()
    text = text.replace("\r\n", "\n").replace("\r", "\n").rstrip("\n")
    if not text.strip():
        raise SystemExit("空文件：%s" % path)
    return text


def fold(title, text):
    """折叠块（details）+ 代码块。整体缩进 4（admonition 结构缩进），
    fence 与代码内容同为 4 —— 剥离结构缩进后内容即无前缀。"""
    return '??? quote "%s"\n\n    ```text\n%s\n    ```' % (
        title, textwrap.indent(text, " " * 4))


def table(header, rows):
    lines = ["| " + " | ".join(header) + " |",
             "|" + "|".join(["------"] * len(header)) + "|"]
    lines.extend("| " + " | ".join(r) + " |" for r in rows)
    return "\n".join(lines)


def build(src, lang):
    blocks = []
    if lang == "zh":
        blocks.append("# 第三方开源组件许可")
        blocks.append(
            "IDES 包含按各自开源许可证分发的第三方组件。本页面收录全部依赖的许可证全文，"
            "用于履行开源许可证公示义务。"
        )
        blocks.append(
            '!!! info "说明"\n'
            "    第三方组件的版权归其各自所有者所有，其许可证义务不受 IDES 自身许可条款影响。\n"
            "    宽松与公有领域许可证允许闭源分发，仅需保留版权声明。"
        )
        blocks.append("## 许可证一览")
        blocks.append(table(
            ["许可证", "说明"],
            [("**%s**" % n if n == "MPL-2.0" else n, zhd) for _f, n, zhd, _e in LICS],
        ))
        blocks.append("## MPL-2.0 特殊义务声明")
        blocks.append(
            "以下组件以 **MPL-2.0**（文件级 copyleft）分发。静态链接并闭源分发合法，"
            "但需按 [MPL §3.1](%s) 提供源码获取方式：" % MPL_URL
        )
        blocks.append(table(["组件", "版本", "来源"], MPL_COMPONENTS))
        blocks.append("## 许可证全文")
    else:
        blocks.append("# Third-Party Licenses")
        blocks.append(
            "IDES bundles third-party components distributed under their respective open source "
            "licenses. This page reproduces the full text of every license involved, fulfilling "
            "our open source license notice obligations."
        )
        blocks.append(
            '!!! info "Note"\n'
            "    Copyright of each third-party component remains with its respective owner; its "
            "license obligations are unaffected by IDES' own terms.\n"
            "    Permissive and public-domain licenses allow closed-source distribution provided "
            "copyright notices are retained."
        )
        blocks.append("## Licenses at a Glance")
        blocks.append(table(
            ["License", "Notes"],
            [("**%s**" % n if n == "MPL-2.0" else n, end) for _f, n, _z, end in LICS],
        ))
        blocks.append("## MPL-2.0 Obligations")
        blocks.append(
            "The following components are distributed under **MPL-2.0** (file-level copyleft). "
            "Static linking and closed-source distribution are permitted, provided the source is "
            "made available per [MPL §3.1](%s):" % MPL_URL
        )
        blocks.append(table(["Component", "Version", "Source"], MPL_COMPONENTS))
        blocks.append("## Full License Texts")
    for fname, name, _zhd, _end in LICS:
        blocks.append(fold(name, read_lic(src, fname)))
    return "\n\n".join(blocks) + "\n"


def check_src(src):
    missing = [f for f, _n, _z, _e in LICS if not os.path.isfile(os.path.join(src, f))]
    if missing:
        print("数据源缺失 %d 个文件：%s" % (len(missing), ", ".join(missing)), file=sys.stderr)
        return False
    print("数据源完整：%d 份许可证全文 @ %s" % (len(LICS), src))
    return True


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--src", default=DEFAULT_SRC, help="LICENSES 数据源目录")
    ap.add_argument("--out-zh", default=DEFAULT_OUT_ZH, help="中文页面输出路径")
    ap.add_argument("--out-en", default=DEFAULT_OUT_EN, help="英文页面输出路径")
    ap.add_argument("--check", action="store_true", help="只校验数据源，不生成")
    args = ap.parse_args()

    ok = check_src(args.src)
    if args.check or not ok:
        return 0 if ok else 1

    for path, content in ((args.out_zh, build(args.src, "zh")),
                          (args.out_en, build(args.src, "en"))):
        with open(path, "w", encoding="utf-8", newline="\n") as fh:
            fh.write(content)
        print("Wrote %s (%d bytes)" % (path, len(content.encode("utf-8"))))
    return 0


if __name__ == "__main__":
    sys.exit(main())
