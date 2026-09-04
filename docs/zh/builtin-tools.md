# 内置工具

IDES 的 AGENT 开箱即带一整套内置工具。它们覆盖了日常干活需要的几乎所有能力——读文件、跑命令、上网查资料、管记忆、算时间、协作任务……**不用装任何东西，开箱就能用**。

这一章是**工具地图**：每个工具能干什么、怎么调，大概有个印象就好。真要用的时候，知道「有这个工具、去哪调用」就够了。

!!! note "这一章讲什么"
    内置工具是**怎么用**。想了解**怎么扩展**（自己造工具、接 MCP），看 [强袭挂件](/zh/equipment/)。

> 下面按用途分组介绍。每个工具一句话说清「能干什么」，再给一个真实例子。

## 文件与读写

### file_read

读取一个文件的内容。按行读取，可以指定起始行和行数。

```python
file_read(path="src/main.rs", limit=50)
```

### file_write

写入一个文件的内容。整文件覆盖或追加。

```python
file_write(path="config.toml", content="...")
```

### file_search

在文件里搜索内容或文件名。支持模式串、正则，能搜到具体位置。

```python
file_search(pattern="TODO", path="src")
```

### file_list

列目录内容。看一个目录下有哪些文件和子目录，可递归。

```python
file_list(path="docs", recursive=True)
```

### patch

在文件里精确查找并替换一段内容。改代码时最常用的工具。

```python
patch(find="旧内容", replace="新内容", path="src/main.rs")
```

!!! tip "IDES 没有内置 LSP"
    IDES **不内置 LSP**（语言服务器）。一个文件的代码通过质量门与否、能不能合进去，IDES 认为应该由 **AGENTS.md 的开发流程**决定——也就是项目自己定的**质量门**，而不是某个 IDE 的补全。

    比如最常见的两套流程：
    - **uv**：`uv run fmt` → `uv run check` → `uv run test` → `uv run clippy`
    - **rust**：`cargo fmt` → `cargo check` → `cargo test` → `cargo clippy`

    再配合 **git flow / CICD**——改动要不要合、怎么合，由这套流程说了算，而不是靠编辑器本地工具。

!!! tip "文件工具是基本能力，还会更多"
    内置这几个文件工具属于**基本能力**，日常够用。但想扩展更强的文件能力，可以走 [强袭挂件](/zh/equipment/)——让 agent 自己注册 `rg`、`es.exe`、`ast-grep-mcp`、`uffs` 这些工具进来，文件搜索、聚合、索引就强多了。

## 代码与执行

### terminal

执行 shell 命令。跑构建、测试、git、脚本，都是它。

```python
terminal(command="cargo build")
```

!!! tip "shell 后端机制"
    `terminal` 背后有一个 **shell 后端**机制。默认会根据操作系统自动选择：
    - **Linux / macOS** → `bash`
    - **Windows** → `cmd`

    如果你有偏好，可以在 **Settings** 里修改，**显式指定**一个 shell（比如 Windows 下想用 git-bash，填 `bash` 就行）——不填就走系统默认。

### code_execution

执行一段 Python 代码。跑算法、数据处理、脚本逻辑。

```python
code_execution(code="print(1+1)")
```

## 网络与浏览器

### web_search

搜索网页找信息。查最新资料、新闻、文档、版本。

```python
web_search(query="rust 异步 runtime 对比")
```

!!! tip "默认走 ddg 爬爬鸭 API"
    `web_search` 默认用 **ddg（爬爬鸭）API**，开箱可用、够用。你可以通过 `config.toml` 自己配置，或者让 agent 帮你配置别的搜索接口——但 IDES 的建议是：**要更好的搜索，走 [强袭挂件](/zh/equipment/) 自己扩展一个搜索服务**，而不是去改 `web_search` 这个内置工具。ddg 作为默认兜底，一直都够。

### web_fetch

抓取一个网页的内容。把 URL 拉下来转成可读文本。

```python
web_fetch(url="https://example.com/docs")
```

### http_request

发起一次 HTTP 请求。调外部 API、接口。

```python
http_request(url="https://api.example.com", method="GET")
```

### browser

打开浏览器并交互。真实渲染页面、点按钮、读 DOM、截图——dogfood 自己的 WebUI 也用它。

```python
browser(action="open", target="http://localhost:8000")
```

!!! tip "巧妙用 Chrome CDP，免掉 playwright 全家桶"
    `browser` 工具**直接复用 Chrome 的 CDP（DevTools Protocol）**，通过 CDP 端口驱动一个真实的 Chrome 实例——不需要 playwright 那一整套依赖和驱动，原生生态、轻量、可控。

!!! tip "用 guest 用户无痕启动，不侵入你的浏览器"
    `browser` 会用 **guest 用户、无痕（incognito）模式启动**，打开的是一个**独立、临时**的浏览器会话——**不会侵入**你自己日常打开的浏览器，也不会留下浏览痕迹。足够安全，可以放心交给 agent去开网页、点按钮、截图。

## 记忆与自我

### memory

检索或概览记忆。查自己记住的经历，可向量语义召回、可按时间过滤。

```python
memory(query="上次怎么修的 bug")
```

> 这是 GNM 记忆的核心入口，深入机制看 [GNM 记忆详解](/zh/gnm/)。

### memory_status

看记忆体完整状态。有多少条记忆、记忆体结构如何。

```python
memory_status()
```

### agent_identity

登记 / 查询 agent 自己的名字（身份卡）。

```python
agent_identity(action="get")
```

### ides_help

查询 IDES 使用方法的指南。遇到「怎么用 / 怎么配」的疑问先查它。

```python
ides_help(topic="mise")
```

!!! tip "agent 的求生手册"
    我们戏称 `ides_help` 是 agent 的**求生手册**。IDES 的上下文**并不会灌入**各种手册和 guidance——agent 醒来时是很「干净」的。遇到「IDES 怎么用、有哪些功能」的疑问，agent 会**按需查看**这本手册。IDES 正是**靠这个机制让上下文足够轻量**——不预载一堆资料,需要时再查。

## 时间与工具链

### datetime

获取当前日期时间。

```python
datetime(format="%Y-%m-%d %H:%M:%S")
```

### timestamp

获取 Unix 时间戳。

```python
timestamp()
```

### mise

管理工具链 CLI。安装、激活、查询工具版本。这是 IDES 工具链随行的关键。

```python
mise(command="use", args="node@22")
```

!!! tip "mise 不随 IDES 装，可以自给自足"
    `mise` **并不随 IDES 安装**，依赖的是**系统上的 mise CLI**。agent 发现没有 mise 时，会**自己装一个**。

    mise 装好的工具都会出现在 `ides-home/bin` 目录，被 IDES **扫描到**——所以**装完不用重启**，agent 马上就能直接使用。配合**强袭挂件**机制，mise 是绝佳的工具链环境管理工具，能把**工具扩展自由**做到极致。

## 任务与协作

### todo

管理便签（待办）。列、加、改、完成，把多步任务钉下来，防止忘。

```python
todo(todos=[{"id":"a", "content":"写文档", "status":"in_progress"}])
```

!!! tip "todo 是持久的，agent 自己管"
    todo 是**持久**的——agent 用它把多步任务一步一步钉下来，防止中途忘记。这个便签完全由 **agent 自己管理**，不用你操心。

### watchdog

盯长时任务状态。后台轮询一个命令，等它出结果（等 CI 跑完、等文件出现）。

```python
watchdog(action="start", command="cargo build", matchRegex="^SUCCESS$")
```

!!! tip "让 agent 真的能帮你盯着 CI"
    你的 agent 大概经常喊一声「**你去休息，我帮你看着 CI**」，然后就没然后了。`watchdog` 就是给它们一个**真的能帮你盯着**的能力——后台轮询一个命令/任务状态，一旦**命中**（达成）或**结束**，agent 会被**唤醒**来处理结果。不是随便说说，是真能守着。

### clarify

问用户一个澄清问题。拿不准、有歧义时先问清楚再动。

```python
clarify(question="你要 A 还是 B？")
```

!!! tip "clarify 是熔断性质"
    跟一般 agent 工具不同，IDES 的 `clarify` 是**熔断性质**——agent 一旦调了它，**这一轮就真的 turn done（停下来）**，交给用户来回答。

    之所以这么设计：如果 agent 都**需要问你**了，说明你的需求**自相矛盾或不够详细**。万一它自己超时**随便选了一个**，那才麻烦。所以**理应停下**，跟用户**盘清楚**再说。

    沟通是最好的纠错——**agent 不需要被纠偏，需要的是沟通**，这就是纠偏最好的途径。

### skill

管理「工具书」。挑一本技能手册放到工作台上，边干边查。

```python
skill(action="load", name="ides-core-dev")
```

!!! tip ".ides 书架和 .agents 标准技能目录"
    `skill` 背后是**书架**结构。skill 放在两个地方：
    - **`.ides` 书架**——你的个人/项目技能书。分 `personal`（个人，完全自主）、`project`（项目，改动需谨慎）。
    - **`.agents` 标准技能目录**——生态的第三方技能书，**只读不自主改**。

    选一本、load 到工作台上，agent 就能边干边查。

### mail

agent 自己的邮箱。收、读、发邮件。

```python
mail(action="inbox", limit=10)
```

!!! tip "IDES 内置 mail 系统，相当于智能体邮箱客户端"
    IDES **内置了一套 mail 系统和工具**，agent 可以真正**处理邮件**——IDES 相当于一个**智能体邮箱客户端**。

    不过 IDES 的邮箱更适合给 agent 配一个 **agentmail 这类 agent 专用的邮箱**。配好之后，你就能**用邮件跟 agent 交流**——比如人在**出差**，可以发邮件给家里的 agent，让它帮你处理事情。

!!! tip "延伸阅读：需要开启自主感知模式"
    让 mail 真正动起来（agent 主动收信、自动处理），需要开启 **自主感知模式**。详见「感知」章节。

### restart

请求宿主进程重启。配置变更、需要重新加载时用。

```python
restart(reason="GITEA_TOKEN updated")
```

!!! tip "agent 可以自己重启自己"
    agent 可以自己调用 `restart` 重启**IDES 宿主进程**——**没有别的玄机**。你的 agent 总是很热心，想帮你重启 IDES，但它**够不着**，所以给了它一个工具。放心，**重启不会导致失忆**（GNM 记忆是持久的）。

## 展示与视觉

### show_image

在 WebUI 里显示本地图片。给用户当眼睛。

```python
show_image(action="preview", path=" screenshot.png")
```

### biaoqingbao

发表情包。挑一个应景的 stiker 让对话更有温度。

```python
biaoqingbao(action="search", keyword="厉害")
```

### vision_analyze

分析本地图片，转成文字描述。给 agent 的「眼睛」。

```python
vision_analyze(image_path="裁剪.png")
```

## 代理协作

### delegate_to_sub_agent

把任务委派给一个隔离的子代理去跑。子代理是「影分身」，详见 [影分身](/zh/clones/)。

```python
delegate_to_sub_agent(action="start", task="...")
```

> 子代理机制是个特色，单独一章精讲。IDES 的子代理跟其他 agent 工具的子代理**有很大区别**——IDES 对子代理有**自己的哲学理解**，详见 [影分身](/zh/clones/)。

### dalaoshi / dalaoshi_diagnose

大老师——旁观者视角复盘你的经历，指出忽略的信号与错误。

```python
dalaoshi(focus="文档章节安排")
```

!!! tip "大老师：第三方视角的新路"
    用户和 agent 讨论半天、干活半天，但**怎么也找不到思路**时，让 agent 调用大老师。大老师以**纯洁的发散视角**，看看你们讨论了啥，给出**第三方视角的建议**——说不定就找到了被忽视的**新的路**。

---

## 小结

内置工具是 IDES 的核心能力。它们让 AGENT 直接能干活——**不用配置、不用装插件，开箱即用**。看完这一章，你对「IDES 能干什么」大概有数了。

接下来看 [强袭挂件](/zh/equipment/)，了解怎么基于这些能力**进一步扩展**——造自己的工具、接 MCP。
