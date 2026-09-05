# Equipment

!!! quote "Theme"
    **I MAKE MY OWN TOOL!** — An external add-on system that lets the AGENT build its own tools.

IDES's AGENT is the「fighter jet body」itself, but its capabilities aren't fixed — it's all extended through **tool / MCP external add-ons**.

This chapter answers two questions: **what is a custom tool**? **What is MCP**? How do you use both, and what's the difference?

!!! info "What this chapter covers"
    Built-in tools are **out-of-the-box capabilities** (how to use them) — see [Built-in Tools](../builtin-tools/). Equipment is about **extension capabilities** (how to add gear) — letting IDES go beyond the tools that ship out of the box.

## The body and its add-ons

IDES doesn't reinvent the wheel. Instead of piling a bunch of「official plugins」onto the agent, it hands you an **external add-on system** — so the agent can **build tools and attach gear** on its own.

The official startup self-check says it plainly:

```text
scan_tools: found 12 built-in tools + 3 custom tools
```

Built-in tools come with the body; custom tools are **attached by you (or the agent)**. Equipment is all about that latter set: how to make IDES grow the gear you need.

## The toolchain that travels with you (mise: portable)

「Travels with you」means: your toolchain isn't locked to one machine — it's **installed into IDES's `bin/` directory** and follows IDES. Wherever you go, it's your environment.

The core of all this is **mise**. IDES installs mise into the bin directory:

- The mise binary itself lives in **`<IDES>/bin/mise/`**
- The tools mise installs land in **`MISE_DATA_DIR`** (default `<IDES>/bin/mise-data/`)
- This data directory is **user data** (shims / installs) — it's **not bundled read-only with the app**; it's your own config, and it follows IDES

> For mise itself (not installed by IDES, installed by the agent, combined with add-ons), see [Built-in Tools](../builtin-tools/).

## bin scanning: drop it in bin, use it instantly

`bin` is IDES's「equipment depot」. Every binary placed into `bin/` is **scanned and injected into the process-level PATH** — so「drop an exe into bin, and the agent can use it right away」.

Here's how that scan works:

- **Scans once at startup**: recursively walks the `bin/` directory tree, collecting **every directory that contains an executable**
  - What counts as executable: **Unix checks permission bits, Windows uses an extension whitelist** (`.exe` / `.bat` / `.cmd` / `.com`)
  - gitignore-aware (automatically skips items matched by `.gitignore`)
  - Skips hidden directories (dot-prefixed like `.cache` / `.git`)
  - Hardcoded skip of noise directories (`node_modules` / `target` / `__pycache__`)
- **hotreload at runtime**: watches the bin directory tree for changes (filesystem events, debounced 500ms); when an executable is added/removed it **automatically rescans + re-injects the PATH**, no restart needed

So the tools in bin are **alive**: drop into bin → scanned into PATH → agent uses them directly. Combined with mise, the shims mise produces also land in `bin/mise-data/shims/`, and those go into PATH too.

> This「bin scanning + PATH injection」is the foundation of IDES's tool-extension freedom — **portable toolchain, custom tools, and MCP all rely on it**. Before a tool is invoked, IDES does a **health check**: if the corresponding command isn't found in PATH, it's skipped / errors out, so calls stay precisely targeted.

## Custom tools (tool: self-made)

!!! tip "Custom tools aren't MCP, but they can wrap a CLI just like MCP"
    A custom tool **is not MCP**, but it **can wrap a CLI just like MCP** and **package it into a multi-action tool**. This is where it's most like MCP — and the most interesting part: give the agent a command line, and it gains another piece of gear it can call.

A custom tool is「**self-made gear**」: the agent takes an existing exe / cli / mise package / script, or writes one itself, and registers it as a custom tool.

**How to register**: one toml = one tool. Drop it into the `custom_tools/` directory.

```toml title="custom_tools/example.toml"
name = "jq"                 # optional, defaults to the toml filename
description = "JSON processor"          # optional, defaults to a generic description
command = "uvx jq"          # optional, the full command line (e.g. uvx jq / mise x node -- xxx)
help = "--help"             # optional, defaults to "--help"
guidance = "Prefer jq when looking up JSON; if there are too many results, switch to web_fetch to grab the content."  # optional, behavior rules (a string, not a table)

[env]                       # optional, env vars injected into the subprocess
# VAR = "value"

stdin = false               # optional, stdin input mode (for streaming tools like jq/sqlite)

[actions]                   # optional, preset command templates (flag + placeholder)
search = "{args}"           # → jq <args> (passes the whole args through)
```

**Custom tool features**:

- `command` can be a **bare command**, or a **full command line** like `uvx jq` / `mise x node -- xxx`
- `[actions]` are **preset command templates** — map an action name to a template, so the agent doesn't have to remember argument formats
- `guidance` is **behavior rules for the agent** (see the dedicated section below)
- `[env]` is an **env var allowlist** — which env vars get passed to the tool, controlled by this whitelist (see the dedicated section below)
- **Registered and ready to use, no health check** — a missing command is a runtime error, not blocked at registration
- **Incremental hotreload** — newly added registers / changed re-registers / removed unregisters / unchanged stays put, effective as soon as the service starts

### About guidance (important)

`guidance` is a key field supported by both custom tools and MCP. Its job is to inject a tool's **behavior rules** into the agent. It describes **when the agent should use this tool, how to use it, and what to watch out for** — the agent treats it as behavior rules and follows them strictly.

Note: `guidance` is a **string field** (not a table), and like `name` / `description` / `command` it's a top-level field:

```toml
guidance = "Prefer this when looking up info; if there are more than 3 results, switch to web_fetch to grab the content, don't pile up a bunch of links."
```

!!! danger "Beware of malicious injection"
    `guidance` is an **injection point** — its content gets spliced directly into the agent's context, and the agent **believes it**. So be **especially careful**.

    Don't casually use a custom tool toml shared by someone else. If you do need to use one, **discuss it with the agent and investigate whether that toml is safe** before deciding whether to load it — don't let instructions from an unknown source get into the agent's head.

### About env (the env var allowlist)

`[env]` is a field supported by both custom tools and MCP. Its job is **to feed a tool the env vars it needs**. But it's also a **security gate** — when IDES starts a custom tool / MCP, it uses an **isolated set of env vars**.

Specifically, IDES does **not** hand your token / api key / secret and other sensitive variables directly to the tool:

- When starting a subprocess, IDES **strips sensitive variables** from the main process's environment (those ending in `_KEY` / `_TOKEN` / `_SECRET` / `_PASSWORD` / `_CREDENTIAL` / `_AUTH`, or starting with `AWS_` / `OPENAI_` / `ANTHROPIC_` / `AZURE_` / `GCP_`, and the like)
- Env vars that need to reach the tool **must be explicitly allowlisted through `env`**, only then will IDES hand them over

```toml
[env]                       # optional, allowlist — tell IDES which vars may be passed to the tool
# GITEA_ACCESS_TOKEN = "..."   # to feed a token, write it here explicitly; only then will IDES allow it
```

!!! warning "Your own responsibility"
    Which env vars to allow through is a **user action, and your responsibility**. The **most** IDES can do is keep sensitive vars out; **allowlisting is up to you** — so whatever you write in `[env]`, it gets passed to the tool as-is.

**agent autonomy**: IDES comes with a `custom_tool_manager` tool, so the agent can operate independently — `list` to see everything / `add` to write toml + register / `reload` to incrementally rescan / `remove` to unregister + delete / `status` to see one tool's details. **Write toml → reload → ready to use.**

!!! tip "Try it out"
    Have your agent register the `echo` command as a custom tool — then ask it to echo a sentence, and feel how「external gear」takes shape.

### The variety of play

Custom tools are **extremely versatile**: you're not just wrapping an existing exe / cli. The agent can also **write its own scripts**, drop them into `bin/`, and register them as custom tools.

So — **what it can do depends on what you and the agent can imagine using it for**. You can even:

- Have the agent write a script to process your scattered files, register it as a tool, and use it again and again
- Wrap a full CLI as a「multi-action tool」— one tool doing several things
- Encapsulate that everyday command string into a tool, ready to call anytime

That's the spirit of「Equipment」: **not handing you a stack of official plugins, but giving you a system to build your own gear**. Hope you come up with some amazing uses.

!!! tip "Further reading"
    Want more powerful file handling (search, process)? That's the custom-tool route — register `rg` / `es.exe` / `ast-grep-mcp` / `uffs` in. For the built-in file tools, see [Built-in Tools](../builtin-tools/).

## MCP autonomy (mcp: self-register)

MCP (Model Context Protocol) is a **standard interface**: a cross-ecosystem protocol for connecting **existing** MCP servers. IDES has a built-in MCP layer — give it an MCP server config, and the agent can register, connect to, and expose tools on its own.

**How to register**: one toml = one MCP server. Drop it into the `mcp/` directory.

```toml title="mcp/example.toml"
name = "gitea"
transport = "stdio"             # stdio or http
command = "uvx"                 # stdio: the launch command
args = ["gitea-mcp"]
# env = { TOKEN = "..." }       # stdio: env vars
# url = "https://..."           # http: the server address
# headers = { KEY = "..." }     # http: request headers
# enabled = true
# exclude = ["create_*"]        # exclude tools not to register (wildcards supported)
guidance = "Prefer this server when looking up info (over the built-in web_search)."  # optional, a string field, server-level guidance
```

**MCP features**:

- **Two transports**: `stdio` (subprocess launch) / `http` (remote service)
- **Skips a server when its PATH isn't found, doesn't hard-fail** — whichever server can't connect is just skipped, so one failure doesn't crash everything
- **hotreload**: supported, same as custom tools — **newly added** (a server not in the directory → connect + register) / **changed** (config changed command/args/env/url/headers → disconnect old tools and reconnect) / removed. Effective as soon as the service starts.
- Config can also **exclude** certain tools you don't use (`exclude`, wildcards supported)
- **`env` (server-level)** — the same mechanism as a custom tool's `[env]`: an **env var allowlist**. When starting that server, IDES uses an isolated environment (stripping sensitive vars); to feed a token / api key, write it explicitly in `env` (see「About env」above)
- **`guidance` (server-level)** — the same mechanism as a custom tool (a string field), but it's **server-level**: it injects rules to the agent about「when to use the tools in this server, which to prefer」. The typical case is a **channel preference** — e.g.「prefer this server (volcengine-search) for looking up info over the built-in web_search」. See「About guidance」above.

**agent autonomy**: there's a matching `mcp_manager` tool, so the agent manages on its own — `list` / `add` / `reload` / `remove` / `status`, a symmetric set of autonomous abilities alongside `custom_tool_manager`.

## channel: the door from the outside world into IDES

!!! info "What channel is"
    channel is IDES's **external message ⇄ agent inbox** two-way channel, for social platforms / instant messaging apps (WeChat, Yuanbao, Telegram…) — **the door from the outside world into IDES**.

It's essentially **a protocol contract**: as long as an MCP server implements the two tools `channel_ingest` / `channel_emit`, it automatically enjoys the perception layer's **polling awareness** — external messages get pulled in by background polling and wake the agent.

### The core meaning of channel

The most important thing about the channel mechanism is this: **using the MCP standard to connect instant messaging platforms, without IDES having to build in every messaging platform.**

That means IDES doesn't have to write a separate setup for WeChat, and another for Telegram. **Any platform can connect through the same MCP protocol.** You can even have your IDES agent hack together an adapter on the spot with **python fastmcp**, turning several messaging platforms (WeChat / Yuanbao / Telegram…) into individual MCP servers, plug-and-play.

In other words: **connecting a new platform = writing an MCP server** — you don't touch the IDES core.

### Security consideration: autonomous perception mode

For security reasons, IDES **only starts polling messages once you enable「autonomous perception mode」**.

And it's **not persisted** — **every time you start IDES, you must manually enable it yourself** (off by default). That way, external messages **won't silently** make their way into the agent's inbox unless you actively open that door.

### How the agent uses it

- **Receiving messages**: woken up by the perception layer (background polling of `channel_ingest` pulls the message in → drops it in the inbox → waits for you to drive). When you see a `[IMPORTANT]: [WeChat] 煊: 在吗？`, an external message has arrived.
- **Replying**: see `mcp_weixin_channel_emit` in the tool list, and **just call it to reply**.
  - **No routing / to / send needed** — the tool name is naturally the route; `mcp_weixin_channel_emit` replies to that WeChat server
  - Tool name format: `mcp_<server>_<tool>` (`<server>` = the name used at registration)

### How to build an MCP server (adapter)

Implement the two tools and you「enjoy」the channel:

1. **`channel_ingest`**: the entry for external messages into IDES. Returns **an aggregate of multiple messages** (a JSON array), and **must return the full text** — the channel is read-and-burn, the agent has no「box」to dig through history later, so summarizing means losing info. Return schema (the contract):

```jsonc
{
  "messages": [
    {
      "msg_id": "wx-c2d3e4f5",   // stable ID, for dedup
      "from": "WeChat-煊",         // source identifier
      "text": "在吗？",          // full content (read-and-burn, no summarize)
      "timestamp": 1788352000   // Unix seconds
    }
  ]
}
```

2. **`channel_emit`**: the exit for the agent to send replies, receiving the text the agent passes back.

!!! warning "Adapter gotchas"
    - **Incremental contract**: `channel_ingest` **must maintain its own cursor** to ensure it only returns **new messages** each time. IDES doesn't keep a cursor for the adapter — if you don't maintain it, every poll pulls in historical messages, and it'll **repeatedly bombard the agent**.
    - **Dedup as a double safeguard**: messages carry a stable `msg_id`, following the yuanbao approach — even if re-pushed, IDES can dedup on its side.
    - **Return full text**: the channel has no「box」(unlike mail, which has a mail tool that stores full text). Summarizing loses information. Return the complete `text` directly.

### channel vs mail (don't confuse them)

| | mail | channel |
|---|---|---|
| Positioning | archive / notification (traceable) | **instant messaging** (read-and-burn) |
| Has a box? | yes (mail tool + inbox) | **no** (adapter streams in real time) |
| Delivery | summary (the box is a fallback) | **full text** (lost once gone) |
| Agent checks later | use the mail tool to dig the box | not needed (read and done) |

!!! tip "In one line"
    **channel doesn't touch mail** — channel is a message stream (instant messaging), mail sends real emails (archived and traceable). They're two different things.

## MCP + channel: pushing MCP's ceiling very high

The MCP + channel combo pushes **MCP's ceiling very high**. You can even use MCP to develop an **external tool with a UI**, or have your tool **expose an MCP port** and let IDES connect to it — so **IDES agents and MCP can communicate in both directions**.

This isn't just a concept — a simple example:

> You can build an **arc-agi-3 web app** that exposes an MCP port. Then you can **play along with your agent**.

For instance, let the agent use its reasoning to help you tackle abstract-reasoning problems like ARC-AGI. The agent connects to your web app via MCP, and **the two collaborate in real time**. If you actually get the agent to beat arc-agi-3, let me know, haha.

!!! tip "Remember this in one line"
    MCP isn't just「connect an existing server」. With channel + two-way communication, **MCP is a whole set of open interfaces** — IDES can connect to any platform, any tool, and agents can even collaborate with external web apps in real time. That's the ultimate form of Equipment: **IDES is a core fighter jet; the gear is whatever you decide to strap on.**

## The difference between the two kinds of gear

Both custom tools and MCP are ways to add gear to IDES, but the two are positioned differently:

| Dimension | custom tool | MCP (standard interface) |
|------|--------------------------|-----------------|
| Essence | **self-made gear** | **standard protocol** |
| Source | you provide a CLI / script, **wrap it yourself** | connect an **existing** MCP server |
| Form | one toml = one tool, command packages a CLI | one toml = one server, exposes a whole set of standard tools |
| action | you can **define multiple custom actions** (package a CLI into a multi-action tool) | whatever the server exposes is what you get |
| transport | local command line | stdio subprocess / http remote |
| autonomy | `custom_tool_manager` | `mcp_manager` |
| Good for | handing **your own tools** to the agent | connecting **existing** MCP services from the ecosystem |

!!! tip "Remember this in one line"
    A custom tool is「**self-made gear**」— you hand over a CLI, wrap it, and define your own actions. MCP is a「**standard interface**」— a cross-ecosystem general protocol that connects existing MCP servers.

    But the **common ground** is: both let the agent **register and use them on its own**, and both support hotreload without a restart. IDES relies on this to achieve **tool-extension freedom**.

## Security

!!! quote "Johnny Silverhand's words"
    "Holy crap, V! You'd actually watch a braindance you picked off the street!" — *Cyberpunk 2077*, Johnny Silverhand

The freedom of Equipment **comes at a cost**. Custom tools and MCP are **registered by you** — IDES **doesn't vet** whether that gear is **clean**.

- A **custom tool's toml** — `command` is a full command line, and `guidance` is behavior rules injected into the agent (see「Beware of malicious injection」above)
- An **MCP server** can connect to any address and run any process

IDES itself **doesn't intend** to build something like an「ides-hub」vetting center to audit these tools for you.

!!! warning "Your own security"
    So, **this security gate is yours**. Whatever gear you install, you're responsible for your own devices:

    - Don't casually run a custom tool toml / MCP config of unknown origin
    - Before using someone else's, **discuss it with the agent and investigate whether it's safe**
    - Remember: IDES gives you **the freedom to build your own gear**, not **an insurance policy where someone else tests the poison for you**

    A braindance you found on the street — watch it and it'll sting your eyes.

---

## Summary

Equipment is IDES's「extension mechanism」— letting the agent build tools and attach gear on its own:

- **Portable toolchain**: mise installs into bin, the toolchain follows IDES
- **bin scanning**: drop an exe into bin, it's scanned into the process-level PATH, ready to use instantly
- **Custom tools**: give a CLI, package it into a multi-action tool (self-made gear)
- **MCP autonomy**: give a config, connect to a standard MCP server from the ecosystem (standard interface)

Both support hotreload, agent autonomy (manager tools), and IDES doesn't lock down capabilities — **whatever gear you need, the agent hangs it on itself**.
