# Built-in Tools

IDES's AGENT ships with a full set of built-in tools out of the box. They cover just about everything you need for day-to-day work — reading files, running commands, searching the web, managing memory, keeping time, coordinating tasks... **No installation, no extra setup — they just work.**

This chapter is a **tool map**: a rough sense of what each tool does and how to call it. When you actually need one, all you have to know is "it exists and where to call it."

!!! note "What this chapter covers"
    Built-in tools are **how to use** them. To learn about **extending** them (building your own tools, connecting MCP), see [Equipment](../equipment/).

> The tools below are grouped by purpose. Each tool gets a one-line description of what it can do, plus a real example.

## Files & Reading & Writing

### file_read

Reads the contents of a file. Reads line by line, and you can specify the starting line and line count.

```python
file_read(path="src/main.rs", limit=50)
```

### file_write

Writes the contents of a file. Overwrites the whole file or appends to it.

```python
file_write(path="config.toml", content="...")
```

### file_search

Searches a file for content or a filename. Supports patterns and regex, and can pinpoint the exact location.

```python
file_search(pattern="TODO", path="src")
```

### file_list

Lists a directory's contents. See what files and subdirectories are under a directory; supports recursion.

```python
file_list(path="docs", recursive=True)
```

### patch

Precisely finds and replaces a snippet in a file. The most commonly used tool when editing code.

```python
patch(find="old content", replace="new content", path="src/main.rs")
```

!!! tip "IDES doesn't ship with an LSP"
    IDES **does not bundle an LSP** (language server). Whether a file's code passes the quality gate and can be merged is something IDES thinks should be decided by **the AGENTS.md development workflow** — that is, the **quality gate** the project itself defines, not some IDE's autocomplete.

    For example, the two most common workflows:
    - **uv**: `uv run fmt` → `uv run check` → `uv run test` → `uv run clippy`
    - **rust**: `cargo fmt` → `cargo check` → `cargo test` → `cargo clippy`

    Combine that with a **git flow / CICD** — whether a change should be merged, and how, is decided by that workflow, not by local editor tools.

!!! tip "The file tools are basic capabilities, and there's more"
    These built-in file tools are **basic capabilities** — enough for everyday use. But if you want more powerful file handling, you can go the [Equipment](../equipment/) route — let the agent register tools like `rg`, `es.exe`, `ast-grep-mcp`, and `uffs` itself, and your file search, aggregation, and indexing get much stronger.

## Code & Execution

### terminal

Executes shell commands. Running builds, tests, git, and scripts all fall to it.

```python
terminal(command="cargo build")
```

!!! tip "Shell backend mechanism"
    Behind `terminal` there's a **shell backend** mechanism. It auto-selects based on the operating system by default:
    - **Linux / macOS** → `bash`
    - **Windows** → `cmd`

    If you have a preference, you can change it in **Settings** and **explicitly specify** a shell (for instance, if you want to use git-bash on Windows, just enter `bash`) — leave it blank and it uses the system default.

### code_execution

Runs a snippet of Python code. For algorithms, data processing, and script logic.

```python
code_execution(code="print(1+1)")
```

## Network & Browser

### web_search

Searches the web for information. For the latest references, news, docs, and versions.

```python
web_search(query="rust async runtime comparison")
```

!!! tip "Defaults to the ddg search API"
    `web_search` uses the **ddg (duckduckgo) API** by default — usable out of the box, good enough for most cases. You can configure it yourself via `config.toml`, or let the agent configure a different search interface for you — but IDES's advice is: **for better search, extend your own search service via [Equipment](../equipment/)**, rather than modifying the built-in `web_search`. ddg as the default fallback has always been enough.

### web_fetch

Fetches the contents of a webpage. Pulls a URL down and converts it into readable text.

```python
web_fetch(url="https://example.com/docs")
```

### http_request

Makes an HTTP request. For calling external APIs and interfaces.

```python
http_request(url="https://api.example.com", method="GET")
```

### browser

Opens a browser and interacts with it. Renders pages for real, clicks buttons, reads the DOM, and takes screenshots — it's also used to dogfood our own WebUI.

```python
browser(action="open", target="http://localhost:8000")
```

!!! tip "Cleverly reuses Chrome CDP, skipping the whole Playwright stack"
    The `browser` tool **directly reuses Chrome's CDP (DevTools Protocol)**, driving a real Chrome instance over the CDP port — no need for the whole set of Playwright dependencies and drivers. Native ecosystem, lightweight, and controllable.

!!! tip "Launches in a guest incognito session so it never touches your browser"
    `browser` launches in a **guest user, incognito mode** session, opening an **independent, temporary** browser session — it **won't intrude** on the browser you use every day, and it leaves no browsing traces behind. Safe enough to hand to the agent for opening pages, clicking buttons, and taking screenshots.

## Memory & Self

### memory

Retrieves or overviews memory. Look up what you've experienced; supports vector semantic recall and filtering by time.

```python
memory(query="how did I fix that bug last time")
```

> This is the main entry point to GNM memory. For the deeper mechanism, see [GNM Memory Guide](../gnm/).

### memory_status

See the full state of the memory store. How many memories there are, and how the memory structure is organized.

```python
memory_status()
```

### agent_identity

Registers / queries the agent's own name (identity card).

```python
agent_identity(action="get")
```

### ides_help

Queries the guide for how to use IDES. When in doubt about "how to use / how to configure," look here first.

```python
ides_help(topic="mise")
```

!!! tip "The agent's survival manual"
    We jokingly call `ides_help` the agent's **survival manual**. IDES doesn't **preload** your context with all kinds of manuals and guidance — when an agent wakes up, it's quite "clean." When the agent hits a question about "how to use IDES, what features does it have," it looks up this manual **on demand**. IDES uses exactly **this mechanism to keep the context lightweight** — not preloading a pile of materials, but looking them up when needed.

## Time & Toolchain

### datetime

Gets the current date and time.

```python
datetime(format="%Y-%m-%d %H:%M:%S")
```

### timestamp

Gets the Unix timestamp.

```python
timestamp()
```

### mise

Manages toolchain CLIs. Install, activate, and query tool versions. This is key to IDES's portable toolchain.

```python
mise(command="use", args="node@22")
```

!!! tip "mise isn't installed with IDES; it's self-sufficient"
    `mise` is **not installed with IDES** — it relies on the **mise CLI on the system**. When the agent finds there's no mise, it **installs one itself**.

    The tools mise installs all land in the `ides-home/bin` directory, which IDES **scans for** — so **no restart is needed after installing**; the agent can use them right away. Combined with the **Equipment** mechanism, mise is an excellent toolchain environment manager, and pushes **tool-extension freedom** to the max.

## Tasks & Collaboration

### todo

Manages sticky notes (todos). List, add, change, complete — pin down multi-step tasks so they don't get forgotten.

```python
todo(todos=[{"id":"a", "content":"write docs", "status":"in_progress"}])
```

!!! tip "todo is persistent, and the agent manages it itself"
    todo is **persistent** — the agent uses it to pin down multi-step tasks one by one so they don't get forgotten mid-way. This sticky note is entirely **managed by the agent itself** — you don't have to worry about it.

### watchdog

Watches a long-running task's status. Polls a command in the background and waits for it to produce a result (waiting for CI to finish, waiting for a file to appear).

```python
watchdog(action="start", command="cargo build", matchRegex="^SUCCESS$")
```

!!! tip "Lets the agent really keep an eye on CI for you"
    Your agent probably often calls out "**you go rest, I'll watch the CI for you**," and then... nothing. `watchdog` gives them the ability to **actually keep an eye for you** — polling a command/task state in the background, and once it **matches** (succeeds) or **finishes**, the agent is **woken up** to handle the result. Not just talk — it really stands guard.

### clarify

Asks the user a clarifying question. When unsure or ambiguous, ask first before acting.

```python
clarify(question="Do you want A or B?")
```

!!! tip "clarify is a circuit-breaker"
    Unlike a typical agent tool, IDES's `clarify` is a **circuit-breaker** — once the agent calls it, **this turn really turns done (stops)**, handing it over to the user to answer.

    The design reason: if the agent has to **ask you**, it means your request is **self-contradictory or not detailed enough**. If it just timed out and **picked one at random**, that would be the real problem. So it **should stop** and **hash things out with you** first.

    Communication is the best error correction — **the agent doesn't need to be corrected; it needs communication**. That's the best way to set it right.

### skill

Manages "handbooks." Pick a skill manual and put it on the workbench, consulting it as you go.

```python
skill(action="load", name="ides-core-dev")
```

!!! tip "The .ides shelf and the .agents standard skill directory"
    Behind `skill` is a **bookshelf** structure. Skills live in two places:
    - **`.ides` shelf** — your personal/project skill books. Split into `personal` (personal, fully autonomous) and `project` (project, changes need care).
    - **`.agents` standard skill directory** — the ecosystem's third-party skill books, **read-only, not to be changed on your own**.

    Pick one, load it onto the workbench, and the agent can consult it as it works.

### mail

The agent's own mailbox. Receive, read, and send emails.

```python
mail(action="inbox", limit=10)
```

!!! tip "IDES ships with a mail system — like an agent mail client"
    IDES **ships with a built-in mail system and tools**, so the agent can genuinely **handle email** — IDES is effectively an **agent mail client**.

    That said, IDES's mailbox is best matched with an **agent-specific mailbox like agentmail**. Once set up, you can **communicate with the agent over email** — for instance, if you're **on a business trip**, you can email the agent at home and have it take care of things for you.

!!! tip "Further reading: requires enabling autonomous perception mode"
    To get mail really moving (the agent proactively receiving and processing messages), you need to enable **autonomous perception mode**. See the "Perception" chapter for details.

### restart

Requests a restart of the host process. Used on configuration changes or when something needs reloading.

```python
restart(reason="configuration updated")
```

!!! tip "The agent can restart itself"
    The agent can call `restart` itself to restart the **IDES host process** — **no other trick behind it**. Your agent is always eager to restart IDES for you, but it **can't reach it**, so it was given a tool. Don't worry, **restart won't cause memory loss** (GNM memory is persistent).

## Display & Visuals

### show_image

Displays a local image in the WebUI. Acting as the user's eyes.

```python
show_image(action="preview", path=" screenshot.png")
```

### biaoqingbao

Sends a sticker. Picks an apt one to make the conversation more warm.

```python
biaoqingbao(action="search", keyword="awesome")
```

### vision_analyze

Analyzes a local image and converts it into a text description. The agent's "eyes."

```python
vision_analyze(image_path="crop.png")
```

## Agent Collaboration

### delegate_to_sub_agent

Delegates a task to an isolated sub-agent to run. The sub-agent is an "afterimage" — see [Afterimage](../afterimage/).

```python
delegate_to_sub_agent(action="start", task="...")
```

> The sub-agent mechanism is a highlight, and gets a chapter of its own. IDES's sub-agents are **very different** from the sub-agents of other agent tools — IDES has its **own philosophical take** on sub-agents. See [Afterimage](../afterimage/).

### dalaoshi / dalaoshi_diagnose

Dalaoshi (the "big teacher") — reviews your experience from a bystander's perspective and points out ignored signals and mistakes.

```python
dalaoshi(focus="document chapter arrangement")
```

!!! tip "Dalaoshi: a new path from a third-party perspective"
    When the user and the agent have discussed for ages, worked for ages, but **still can't find an approach**, have the agent call the dalaoshi. The dalaoshi, with a **pure, divergent perspective**, looks at what you've discussed and offers **third-party advice** — maybe it finds the **new path** you'd been overlooking.

---

## Summary

Built-in tools are IDES's core capability. They let the AGENT get to work directly — **no configuration, no plugins to install, ready out of the box.** After reading this chapter, you should have a rough sense of "what IDES can do."

Next, check out [Equipment](../equipment/) to learn how to **extend further** on top of these capabilities — building your own tools and connecting MCP.
