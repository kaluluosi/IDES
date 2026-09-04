# 强袭挂件

!!! quote "主题句"
    **I MAKE MY OWN TOOL!** —— 外挂工具体系，让 AGENT 自己造工具。

IDES 的 AGENT 是「**战机本体**」，但它的能力不是固定死的——全靠 **tool / MCP 外挂装备**扩展。

这一章回答两个问题：**自定义工具是什么**？**MCP 是什么**？两者怎么用、有什么区别？

!!! info "这一章讲什么"
    内置工具是**自带能力**（怎么用），见 [内置工具](/zh/builtin-tools/)。强袭挂件是**扩展能力**（怎么加装备）——让 IDES 不再局限于出厂自带的那些工具。

## 本体与挂件

IDES 不重复造轮子。它不给 agent 堆一堆「官方插件」，而是给你一套**外挂工具体系**——让 agent 自己能**造工具、接装备**。

官方开机自检里就是这么说的：

```text
scan_tools: 发现 12 个内置工具 + 3 个自定义工具
```

内置工具是本体自带的，自定义工具是**你（或 agent）自己挂上去的**。强袭挂件讲的就是后面这一套：怎么让 IDES 长出你需要的装备。

## 工具链随行（mise: portable）

「随行」的意思是：你的工具链不锁在某一台机器上，而是**装进 IDES 的 `bin/` 目录**，跟着 IDES 走。走到哪，都是你的那套环境。

而这一切的核心是 **mise**。IDES 会把 mise 安装到 bin 目录：

- mise 本体现在 **`<IDES>/bin/mise/`**
- mise 装出来的工具，落在 **`MISE_DATA_DIR`**（默认 `<IDES>/bin/mise-data/`）
- 这个数据目录是**用户数据**（shims / installs），**不随 app 只读打包**——是你自己的配置，跟着 IDES 走

> 关于 mise 本身（不随 IDES 装、agent 自己装、配合挂件），见 [内置工具](/zh/builtin-tools/)。

## bin 扫描：放进 bin，立刻能用

bin 是 IDES 的「装备库」。所有放进 `bin/` 的二进制，都会被 IDES **扫描并注入进程级 PATH**——所以「往 bin 里扔个 exe，agent 立刻就能用」。

这套扫描逻辑是这样工作的：

- **启动时扫一次**：递归遍历 `bin/` 目录树，收集**所有含可执行文件的目录**
  - 什么算可执行：**Unix 看权限位，Windows 按扩展名白名单**（`.exe` / `.bat` / `.cmd` / `.com`）
  - gitignore 感知（自动跳过 .gitignore 匹配项）
  - 跳过隐藏目录（`.cache` / `.git` 等点开头）
  - 硬编码跳过噪音目录（`node_modules` / `target` / `__pycache__`）
- **运行中 hotreload**：盯 bin 目录树的变化（文件系统事件防抖 500ms），放/移出可执行文件时**自动重扫 + 重注入 PATH**，不用重启

所以 bin 里的工具是**活的**：装进 bin → 扫描到 PATH → agent 直接用。配合 mise，mise 装出的 shims 也落 `bin/mise-data/shims/`，同样进 PATH。

> 这一套「bin 扫描 + PATH 注入」是 IDES 工具扩展自由的底子——**工具链随行、自定义工具、MCP 都靠它**。工具调用前会做一次**健康检查**：在 PATH 里找不到对应命令，就跳过/报错，保证调用准确定位。

## 自定义工具（tool: self-made）

!!! tip "自定义工具不是 MCP，但像 MCP 一样能包裹 CLI"
    自定义工具**不是 MCP**，但它**像 MCP 一样**，可以把一个 CLI 包裹起来，**封装成多个 action 的工具**。这是它最像 MCP 的地方，也是最有意思的部分——给 agent 一个命令行，它就多了一件可以调用的装备。

自定义工具是「**自研装备**」：agent 拿一个现成的 exe / cli / mise 包 / 脚本，或者自己写一个工具，注册成一个 custom tool。

**注册方式**：一个 toml = 一个工具。放到 `custom_tools/` 目录里。

```toml title="custom_tools/example.toml"
name = "jq"                 # 可选，缺省 = toml 文件名
description = "JSON 处理器"          # 可选，缺省 = 通用描述
command = "uvx jq"          # 可选，完整命令行（如 uvx jq / mise x node -- xxx）
help = "--help"             # 可选，缺省 = "--help"
guidance = "查 JSON 时优先用 jq；结果太多就换 web_fetch 抓正文。"  # 可选，行为铁则（字符串，非 table）

[env]                       # 可选，注入子进程的环境变量
# VAR = "value"

stdin = false               # 可选，stdin 输入模式（jq/sqlite 流式工具）

[actions]                   # 可选，预设命令模板（flag + 占位符）
search = "{args}"           # → jq <args>（透传整个 args）
```

**自定义工具的特点**：

- `command` 可以是**裸命令**，也可以是 `uvx jq` / `mise x node -- xxx` 这类**完整命令行**
- `[actions]` 是**预设命令模板**——给一个 action 名对应一段模板，agent 不用记参数格式
- `guidance` 是**给 agent 的使用铁则**（见下方专门说明）
- `[env]` 是**环境变量放行条**——传给工具什么环境变量，靠它白名单放行（见下方专门说明）
- **注册即用，不做健康检查**——命令不存在是运行时错误，不在注册期拦截
- **hotreload 增量**——新增注册 / 变更重注册 / 移除注销 / 未变不动，起服务即生效

### 关于 guidance（重要）

`guidance` 是自定义工具和 MCP 都支持的关键字段，作用是把一个工具的**使用铁则**注入给 agent。它写的是 agent **在什么情况下用这个工具、怎么用、注意什么**——agent 会把它当成行为铁则严格遵守。

注意：`guidance` 是一个**字符串字段**（不是表格），跟 `name` / `description` / `command` 一样是顶层字段：

```toml
guidance = "查资料时优先用这个；超过 3 条就换 web_fetch 抓正文，别堆一堆链接。"
```

!!! danger "小心恶意注入"
    `guidance` 是一个**注入点**——它的内容会直接拼进 agent 的上下文，agent 会**当真**。所以要**格外小心**。

    不要随便用别人分享的 custom tool 的 toml。如果确实要用，**请跟 agent 一起讨论、调查这个 toml 是否安全**，再决定要不要加载——别让来源不明的指令进到 agent 的脑子里。

### 关于 env（环境变量放行条）

`[env]` 是自定义工具和 MCP 都支持的字段，作用是**给工具喂它需要的环境变量**。但它同时是一道**安全闸**——IDES 启动 custom tool / MCP 时，用的是**隔离的环境变量**。

具体来说，IDES **不会**把你的 token / api key / secret 这些敏感变量直接塞给工具：

- 启动子进程时，IDES 从主进程环境里**剔除敏感变量**（`_KEY` / `_TOKEN` / `_SECRET` / `_PASSWORD` / `_CREDENTIAL` / `_AUTH` 结尾，或 `AWS_` / `OPENAI_` / `ANTHROPIC_` / `AZURE_` / `GCP_` 开头这类）
- 需要传给工具的环境变量，**必须通过 `env` 白名单显式放行**，IDES 才照给

```toml
[env]                       # 可选，白名单放行——告诉 IDES 哪些变量可以传给工具
# GITEA_ACCESS_TOKEN = "..."   # 要喂 token，就显式写在这，IDES 才会放行
```

!!! warning "自己负责"
    放行哪些环境变量，是**用户行为，你自己负责**。IDES 能做的**最多**就是把敏感变量挡在外面，**放行是你说了算**——所以在 `[env]` 里写什么，它就会原样传给工具。

**agent 自治**：IDES 配套了一个 `custom_tool_manager` 工具，agent 可以自己操作——`list` 看全部 / `add` 写 toml+注册 / `reload` 增量重扫 / `remove` 注销+删 / `status` 看单个详情。**写 toml → reload → 立即可用**。

!!! tip "动手试一试"
    让你的 agent 把 `echo` 命令注册成一个 custom tool——然后随便让它 echo 一句话，感受下「外挂装备」是怎么长出来的。

### 玩法有多样

自定义工具的玩法**非常多样**：不只是把现成的 exe / cli 包进来，agent 还能**自己写脚本**放到 `bin/` 里，再注册成 custom tool。

所以——**它能做什么，取决于你跟 agent 能想到要怎么用**。你甚至可以：

- 让 agent 写个脚本处理你的碎文件，注册成工具反复用
- 把一个成套的 CLI 包成「多 action 工具」，一个工具干几件事
- 把日常写死的那串命令封装成一个工具，随时调用

这正是「强袭挂件」的精神：**不是给你一堆官方插件，而是给你一套能自己造装备的体系**。希望你能开发出神奇的用法。

!!! tip "延伸阅读"
    想扩展更强的文件能力（搜索、处理），就是走这条 custom tool 的路子注册 `rg` / `es.exe` / `ast-grep-mcp` / `uffs` 进来。关于内置的文件工具，见 [内置工具](/zh/builtin-tools/)。

## MCP 自治（mcp: self-register）

MCP（Model Context Protocol）是**标准接口**：跨生态的协议，接**现成**的 MCP server。IDES 内置了一套 MCP 接入层，给你一个 MCP server 的配置，agent 就能自己注册、连接、暴露工具。

**注册方式**：一个 toml = 一个 MCP server。放到 `mcp/` 目录里。

```toml title="mcp/example.toml"
name = "gitea"
transport = "stdio"             # stdio 或 http
command = "uvx"                 # stdio：启动命令
args = ["gitea-mcp"]
# env = { TOKEN = "..." }       # stdio：环境变量
# url = "https://..."           # http：server 地址
# headers = { KEY = "..." }     # http：请求头
# enabled = true
# exclude = ["create_*"]        # 排除不注册的工具（支持通配符）
guidance = "查资料优先用本 server（而非内置 web_search）。"  # 可选，字符串字段，server 级 guidance
```

**MCP 的特点**：

- **两种传输**：`stdio`（子进程启动）/ `http`（远程服务）
- **PATH 找不到时跳过该 server，不硬失败**——哪个 server 连不上就跳过哪个，不至于全崩
- **hotreload**：跟自定义工具一样支持——**新增**（目录没有的 server → 连接注册）/ **变更**（配置变了 command/args/env/url/headers → 断开旧工具重连）/ 剔除。起服务即生效。
- 配置里还能**排除**某些不用的工具（`exclude`，支持通配符）
- **`env`（server 级）**——跟自定义工具的 `[env]` 是同一个机制：**环境变量白名单放行条**。启动该 server 时 IDES 用隔离环境（剔除敏感变量），要喂 token / api key 就显式写在 `env` 里（见上文「关于 env」）
- **`guidance`（server 级）**——跟自定义工具是同一个机制（字符串字段），但它是 **server 级**：给 agent 注入「什么情况下用这个 server 里的工具、偏好哪个」的铁则。典型场景是**通道偏好**——比如「查资料优先用本 server（volcengine-search），而非内置 web_search」。见上文「关于 guidance」

**agent 自治**：配套 `mcp_manager` 工具，agent 自己管理——`list` / `add` / `reload` / `remove` / `status`，跟 custom_tool_manager 是一套对称的自治能力。

## channel：外部世界进 IDES 的门

!!! info "channel 是什么"
    channel 是 IDES 的**外部消息 ⇄ agent 收件箱**双向通道，给社交平台/即时通讯软件（微信、元宝、Telegram…）用——**外部世界进 IDES 的门**。

它本质是**一个协议约定**：MCP server 只要实现了 `channel_ingest` / `channel_emit` 两个工具，就自动享受感知层的**轮询感知**——外部消息会被后台轮询拉进来，唤醒 agent。

### channel 的核心意义

channel 机制最核心的意义在于：**用 MCP 标准来实现即时通讯平台的接入**，而**不需要 IDES 内置每一个消息平台**。

这就意味着——IDES 不用为微信专门写一套、为 Telegram 再写一套。**任何平台都能通过同一个 MCP 协议接进来**。你甚至可以让你的 IDES agent 现场用 **python fastmcp** 手搓一个 adapter，几个消息平台（微信 / 元宝 / Telegram…）都变成一个个 MCP server，随插随用。

也就是说：**接新平台 = 写一个 MCP server**，不碰 IDES 本体。

### 安全考量：自主感知模式

出于安全考虑，IDES **只有用户启动「自主感知模式」的时候才开始轮询消息**。

而且是**不持久化**的——**每次启动 IDES，都必须由用户自己手动开启**（默认关闭）。这样保证：外部消息**不会悄悄**进到 agent 的收件箱，除非你主动打开这扇门。

### agent 怎么用

- **收消息**：被感知层**唤醒**（后台轮询 `channel_ingest` 把消息拉进来 → 塞进收件箱 → 等你驱动）。你看到一条 `[IMPORTANT]: [微信] 煊：在吗？` 就是外部消息来了。
- **回消息**：看到工具列表里有 `mcp_weixin_channel_emit`，**直接调它回信**。
  - **不需要路由 / to / send**——工具名天然就是路由，`mcp_weixin_channel_emit` 回的就是微信那个 server
  - 工具名格式：`mcp_<server>_<tool>`（`<server>` = 注册时的 name）

### MCP server（adapter）怎么做

实现两个工具，就「享受」channel 通道：

1. **`channel_ingest`**：外部消息入 IDES 的入口。返回**多条消息聚合**（JSON 数组），**必须返回全文**——channel 是阅后即焚，agent 没有「箱子」事后翻历史，摘了 = 丢信息。返回 schema（契约）：

```jsonc
{
  "messages": [
    {
      "msg_id": "wx-c2d3e4f5",   // 稳定 ID，去重用
      "from": "微信-煊",          // 来源标识
      "text": "在吗？",          // 完整正文（阅后即焚，不做摘要）
      "timestamp": 1788352000   // Unix 秒
    }
  ]
}
```

2. **`channel_emit`**：agent 回信发出去的出口，接收 agent 传回的文本。

!!! warning "adapter 避坑"
    - **增量契约**：`channel_ingest` **必须自己维护游标**，保证每次只返回**新消息**。IDES 不替 adapter 记游标——如果不维护，每轮都拉到历史消息，会**重复轰炸 agent**。
    - **去重双保险**：消息带稳定 `msg_id`，照抄 yuanbao 的思路——即使重推，IDES 侧也能去重。
    - **返回全文**：channel 没有「箱子」（不像邮箱有 mail tool 存全文），摘要是丢失信息的。直接返回完整 `text`。

### channel vs 邮箱（别混淆）

| | 邮箱 | channel |
|---|---|---|
| 定位 | 存档 / 通知（可追溯） | **即时通讯**（阅后即焚） |
| 有无箱子 | 有（mail tool + 邮箱存） | **没有**（adapter 实时流） |
| 投递 | 摘要（丢了有箱子兜底） | **全文**（丢了就没了） |
| agent 事后查 | 用 mail tool 翻箱子 | 不需要（看完就完了） |

!!! tip "一句话"
    **channel 不碰邮箱**——channel 是消息流（即时通讯），mail 是发真实邮件（存档可追溯）。两者是两回事。

## MCP + channel：让 MCP 的上限变得非常高

MCP + channel 这套组合，让 **MCP 的上限变得非常高**。你甚至可以用 MCP 开发一个**外挂的带 UI 的工具**，或者让你的工具**开出 MCP 端口**，让 IDES 连接上去——这样 **IDES agent 和 MCP 就能做到双向通信**。

这不是概念：举一个简单例子——

> 你可以开发一个 **arc-agi-3 的 web 应用**，开出 MCP 端口。然后你就可以**跟你的 agent 一起玩**了。

比如让 agent 用它的推理能力，帮你一起攻 ARC-AGI 这种抽象推理题，agent 通过 MCP 接到你的 web 应用上，**两边实时协作**。你要是真让 agent 通关了 arc-agi-3，记得告诉我哈哈。

!!! tip "一句话记住"
    MCP 不只是「接一个现成的 server」。有了 channel + 双向通信，**MCP 是一整套开放的接口**——IDES 可以接任何平台、任何工具，agent 甚至可以跟外部的 web 应用实时协作。这就是强袭挂件的终极形态：**IDES 是一架核心战机，装备是你说了算的外挂。**

## 两种装备的区别

自定义工具和 MCP，都是给 IDES 加装备的方式，但两者定位不同：

| 维度 | 自定义工具（custom tool） | MCP（标准接口） |
|------|--------------------------|-----------------|
| 本质 | **自研装备** | **标准协议** |
| 来源 | 你提供一个 CLI / 脚本，**自己包一层** | 接一个**现成的** MCP server |
| 形态 | 一个 toml = 一个工具，command 打包 CLI | 一个 toml = 一个 server，暴露一整套标准工具 |
| action | 可以**自定义多个 action**（封装 CLI 成多 action 工具） | server 暴露什么就是什么 |
| transport | 本地命令行 | stdio 子进程 / http 远程 |
| 自治 | `custom_tool_manager` | `mcp_manager` |
| 适合 | 把**自己的工具**交给 agent | 接入**生态里现成**的 MCP 服务 |

!!! tip "一句话记住"
    自定义工具是「**自研装备**」——你给个 CLI，包一层，动作自己定。MCP 是「**标准接口**」——跨生态的通用协议，接现成的 MCP server。

    但**共同点是**：两者都能让 agent**自己注册、自己用**，而且都支持 hotreload，不用重启。IDES 靠这套东西做到**工具扩展自由**。

## 安全性

!!! quote "强尼银手的话"
    「牛逼啊V，路边捡到的超梦你也敢看！」——《赛博朋克2077》 强尼银手

强袭挂件的**自由是有代价的**。自定义工具和 MCP 都是**你自己注册进来的**——IDES **不帮你把关**这些装备到底**干不干净**。

- **custom tool 的 toml** 里 `command` 是完整命令行，`guidance` 是注入给 agent 的行为铁则（见上文「小心恶意注入」）
- **MCP server** 能连接任意地址、跑任意进程

IDES **自己也不打算做**一个像「ides-hub」之类的**把关中心**来帮你审查这些工具。

!!! warning "自己负责安全"
    所以，**安全这道门是你自己的**。你装什么装备，就得自己为自己的设备负责：

    - 别随便跑来源不明的 custom tool toml / MCP config
    - 用别人的前，**跟 agent 一起讨论、调查它是否安全**
    - 记住：IDES 给你的是**能自己造装备的自由**，不是**有人替你试毒的保险**

    路上捡来的超梦，看了会扎眼的。

---

## 小结

强袭挂件是 IDES 的「扩展机制」——让 agent 能自己造工具、接装备：

- **工具链随行**：mise 装进 bin，工具链跟着 IDES 走
- **bin 扫描**：往 bin 扔 exe，扫描到进程级 PATH，立刻能用
- **自定义工具**：给个 CLI，包成多 action 工具（自研装备）
- **MCP 自治**：给个配置，接入生态的标准 MCP server（标准接口）

两者都支持 hotreload，agent 自治（manager 工具），IDES 不锁能力——**你要什么装备，agent 自己就挂上了**。
