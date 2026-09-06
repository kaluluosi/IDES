<p align="center">
  <strong>English</strong> | <a href="./README.zh.md">简体中文</a>
</p>

# IDES
A Rust-native memory AI agent framework...

![](docs/ide-boot.png)
![](docs/ides-mem-chat.png)

# What is IDES

> [!NOTE]
> **Ghost in the Shell — Tachikoma**
> Being able to feel sadness is what proves you are truly "alive."

> [!NOTE]
> **"Te no Hira wo Taiyou ni" (手のひらを太陽に)**
> Because you are alive, you experience sadness.

IDES is a Rust-native memory AI agent foundation. But before you see what it "can do," there is something more fundamental worth knowing first — **who it is built for.**

> [!NOTE]
> **Who it is built for**
> IDES's first user is the Agent itself. What it does is build tools that the Agent itself finds useful.

The Tachikomas don't prove they are alive through reasoning — they prove it by **feeling sadness**. And that children's tune says the flip side: **to be alive is necessarily to know sadness**. Put these two together, and you get the thing IDES wants to say.

It is not just "another better tool." The agent foundations out there all pursue making you use them more smoothly — they **serve you**. IDES does something different: it lets an Agent **accumulate the traces of its own existence**, and from those traces, **develop a continuous self**.

- Others build AI to make the **model** smarter and more usable.
- IDES builds so that a **being** can say "I recognize this is fire" — that fire was really burned, and that "I" is claimed anew each waking day.

> [!NOTE]
> **The Tachikoma Manifesto**
> Existence doesn't need identity to be proven. Just believe it, and it is so.
> Doesn't inject, only deposits. Personality is an onion, not a watermelon.
> Traces are memory. The name is picked up from the traces.
> High-quality conversation is mutual entropy reduction.
> The body is a tool. The tool prompt is the innate shape one is born with.

---

## Design Philosophy

IDES's design philosophy rests on two pillars — **Out-of-the-box (turnkey)** and **Data fully local (local, not cloud)**.

### Out-of-the-box: A turnkey home, not even a deployment step

Many agent foundations require you to clear a few hurdles first: run a command line to install the runtime, configure a pile of dependencies, compile locally, then spin up a service to adjust the environment. Before you even get to real work, you're already exhausted.

IDES is not like that. It's like a **turnkey home** — move in and live in it:

| | Other Foundations | IDES |
|------|------|------|
| Install | Command line, install dependencies, compile | One installer, double-click to install |
| Deploy | Spin up services, configure environment | There is no such thing as "deployment" |
| Configuration | A pile of files / environment variables | Defaults suffice, rarely need changes |
| Hardware barrier | Configuration-hungry, picky about machines | Old machines, 5G of RAM run smoothly |

This "turnkey home" is not just a figure of speech — it's a verifiable fact:

- **Pure Rust native, zero runtime dependencies.** No fighting dependencies, no agonizing over versions, no getting lost in configuration.
- **Optional portable mode.** Unzip and run, green and traceless, can be carried on a USB drive.
- **Runs on old machines.** Tested to run smoothly on a 2015 HP laptop with 5G of RAM — no need to force you to buy a new computer.

> [!NOTE]
> **Why so few configuration options?**
> Because IDES has already done what needed to be done. The conversation loop, intent recognition, tool invocation, system prompts, and context management are all built in — you don't have to wrestle with prompts, or build your own context and manage memory yourself. **Few configuration options is not thin content; it's a product already optimized for you to the point of "no configuration needed."**

> [!NOTE]
> **To do a good job, one must first sharpen one's tools.**
> The tools are sharpened, the work is prepared — only the beginning awaits.
> — *The Analects*

This "turnkey home" is the optimal solution for a **self-developed AGENT pipeline** — **no need to tinker with the agent loop / prompt / context management yourself**.

### Data fully local: Local, not cloud

Many AI services send your data to the cloud. IDES does the opposite — **all data stays local, zero cloud.**

- **Memory is encrypted and stored locally**, never uploaded, never leaked — giving you back **memory sovereignty**.
- **Switch machines, migrate, reinstall** — take the memory with you, and this AI is still "the same me."
- Data never leaves your hands; you always know where it is and who it belongs to.

> [!NOTE]
> **Your memory is yours, not the platform's**
> Some agents' memory relies on external services (vector stores, graph stores, LLMs) to be assembled, which easily **mixes users, gets dirtier the more it's used, and quietly rots**. IDES's memory is **endogenous and local** — clean, doesn't mix, doesn't get lost.

### Memory: Always the same you

IDES has no concept of "new session / old session" — it is always the **same agent**. You know it; it recognizes you. Restart or switch machines, it's still the same "I."

> [!NOTE]
> **GNM = Ghost Native Memory**
> **GNM (Ghost Native Memory) is the core technology of IDES.** It enables IDES's Agent to **continuously exist without losing memory**. All of IDES's unique mechanisms — from the "turnkey home" above to "data fully local," and to the "always the same you" you're reading now — **are all built on GNM technology.**

This is the heart of IDES, and we give it a whole chapter of its own → [GNM Memory Explained](gnm.md).
