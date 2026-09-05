# GNM Memory Explained

!!! info "GNM = Ghost Native Memory"

!!! quote "《Ghost In The Shell》"
    Memory and consciousness are not things that can be physically preserved. What we call a "soul" is merely a "phenomenon" sustained by memory and consciousness together.

GNM is, in a sense, the **Ghost**—an engineered realization of the digital self. Even the author isn't entirely sure it counts. At the very least, IDES's agent **never loses its memory and never forgets what it has done or who it is**.

!!! note "What this chapter focuses on"
    This chapter focuses on what the GNM memory system brings you—its uniqueness, its edge over similar systems on the market, and how it keeps memory sovereignty local on your machine.

AI agent memory systems are a hot topic right now, but most products out there actually **only do one thing: a retrieval system**. Even Mem0 admits it: "Hook a vector database into an agent pipeline and all you get is similarity search, not memory." GNM takes a different path—it turns memory into **the agent's self**, not an outsourced component.

## What makes GNM unique

### 1. Continuous self-awareness

An agent is no longer a "blank slate" reset on every restart. It has a continuous identity, a history, and self-awareness—what you talked about yesterday, it remembers today, and it remembers that "it was part of its own experience."

### 2. Owned, internalized memory

An agent **embodies** its memory rather than being an **observer** that reads documents and logs. These memories are "my experiences," not "a piece of material." That's why it protects itself, defends itself, and grows judgment out of experience—this is the essence of "having a self," a far cry from a cold agent reading logs.

### 3. Condensed, but with full context

Memory is **condensed** (otherwise it wouldn't fit), but after condensation it still preserves the **causal chain and context**—an agent accumulates continuous experience and insight, not a patchwork of isolated fragments.

## GNM's design philosophy

Uniqueness is the "effect"; the design philosophy is "why it's done this way." GNM's underlying principle is two things: **trust, and letting it be**.

### 1. Memory is immutable, but can be corrected by new memory

GNM **has no function to add, delete, or modify memory**—memory cannot be tampered with. Past memories are what happened; they won't be deleted, and they won't be "rewritten" into something else. However, new memory can **correct** old memory (overwriting old conclusions with new information). The whole process is **fully automatic and invisible to the agent**—it's not the agent managing its memory, it's memory **metabolizing itself**.

!!! tip "Memory takes care of itself"
    This is the exact opposite of the market's "give the agent a memory management tool/API" approach. GNM doesn't hand you a tool, because you don't need one—**memory takes care of itself**.

### 2. Hot/cold memory: natural forgetting and re-surfacing

Older memories naturally **slide out of the window** as memory grows and can't be directly retrieved. But **deep retrieval and user guidance** can recall them, regenerating them as **hot memory**—achieving the hot/cold metabolism of "**natural forgetting + re-surfacing**."

!!! tip "It's not storage being replicated, it's metabolism"
    This is exactly how the human brain works: it sinks when unused, comes back when needed, then goes "hot" again. GNM doesn't replicate "storage"—it replicates **metabolism**.

### 3. Memory can't be forgotten—it's just temporarily out of reach

!!! quote "《Spirited Away》 Granny Zeniba"
    Once something has happened, it can never be forgotten—it's just that, for a moment, you can't recall it.

This quote fits GNM perfectly: memory is **never truly lost**; it's just temporarily sunk into the cold zone. Whenever you need it, it can be pulled back. **Forgetting is an illusion; sinking is real.**

## Side by side: why GNM is different

The mainstream memory systems on the market (Mem0 / Zep / Letta / LangMem) mostly share these **common weaknesses**, which happen to be exactly where GNM differentiates:

| Dimension | Mem0 | Zep | Letta / LangMem | **GNM** |
|------|------|-----|-----------------|---------|
| Positioning | Memory API (retrieval layer) | Temporal knowledge graph | Layered / state blocks | **Self (embodied)** |
| Storage | External vector / graph store | Graph + vector store | Files / DB | **Self-built embedded** |
| Deployment | Cloud / Docker | Cloud / Docker | Service | **Local embedded** |
| Offline | ❌ | ❌ | ❌ | ✅ |
| Memory form | Vector (unreadable) | Graph nodes | State blocks | **Agent-readable text** (sanitized externally) |
| Context | Isolated facts | Temporal graph | Layered | **Causal-chain summary** |
| Latency | Hundreds of ms | 87–104 ms | High | **µs-level** |

### Common weakness 1: Most only build a "retrieval system"

A vector store only understands similarity; it **doesn't know what's worth remembering, doesn't know time, doesn't know contradictions**. This is the deepest pit in the whole category.

### Common weakness 2: The memory format is unreadable—the agent is an observer

Mem0=vector, Letta=state blocks, Zep=graph nodes—**none of them are human-readable**. The agent merely "fishes" memories out to use them, an observer reading a document or log.

### Common weakness 3: Memory is a collage of "isolated facts" with no context

Mem0 compresses conversations into declarative isolated facts (ADD/UPDATE/DELETE), **weak at multi-hop and temporal reasoning**. Zep uses graphs to add temporality, but it's still "facts," not "experiences."

### Common weakness 4: Requires external infrastructure—your data leaves your machine

Mem0 = cloud + external vector store + API key; Zep = cloud + graph store; Letta requires running an agent service. Only a few can run offline, but with thin functionality.

### Common weakness 5: The storage engine is a "logical layer patched together from others' databases"

Mem0's foundation is Qdrant+Neo4j+Redis+SQLite stitched together—cross-database transactions can break. GNM is **self-built embedded storage**, one engine managing everything.

## Local operation and persistence: memory sovereignty + privacy

GNM **runs on your machine and your memory never leaves it**. No external vector store or cloud service—data sovereignty stays in your hands. This is the fundamental solution for privacy-sensitive scenarios.

At the same time, **memory is text-readable but encrypted at rest**. To the agent, memory is text it can "read" (unlike vectors that only support similarity search), and it's **encrypted on disk with data sovereignty in your hands**. But externally, memory is never shown as raw content—the hosting layer sanitizes it, and users can only understand what it remembers through the agent's recounting. It stays readable (for the agent) and secure (for you).

## Engineering advantages (backed by benchmark data)

GNM's memory foundation (local embedded) has concrete numbers in benchmarks:

| Metric | Value |
|------|------|
| Write throughput | ~42 entries/sec (23.7 ms) |
| Point-read latency | **4.0 µs** |
| Full-text retrieval filter | < 10 µs |
| Vector retrieval full-table (1K entries) | ~3 ms |
| Disk usage for 100K entries | ~362 MB |

- **Embedded storage, no external service**: no need to configure a vector store or API key like Mem0
- **High performance**: µs-level reads/writes, nearly full memory speed
- **No message loss**: async queue, crash-safe, naturally retrying, degradable

---

## Because of GNM, no fiddling needed

GNM doesn't just bring you "memory"—it **changes how you use the agent**. The three things other agents make you fiddle with—**splitting sessions, stretching context, managing memory**—in IDES, because of GNM, you touch none of them.

**1. Boundless NO_SESSION: there is no such thing as a "session"**

Because of GNM, the agent **never loses memory**, so the concept of "session" no longer exists—there's no "new conversation" or "old conversation," always the **same agent**, with no reset and no switching, always remembering you and itself.

!!! quote "《Zhuangzi》 Tianxia"
    Establishing it on the permanent and the nonexistent; making the Great Unity the master.

It's not "one feature removed"—it's **one thing you no longer have to worry about**. You don't build sessions, don't switch, don't manually recover context, because memory remembers everything for you.

**2. Scroll SCROLLS: no need to stretch context**

Because long-term memory is handed off to GNM, **context only needs to carry what's recent**. IDES's agent can stay within **20% of the context** at all times yet still maintain continuity—the context window scrolls intelligently, cache hits **above 90%**, the focus is always in view, **never brutally truncated**.

Others struggle by "piling on long context"; IDES catches it lightly with "**memory + scrolling**."

---

## Conclusion: GNM is IDES's core technology

No sessions, scrolling context, no born memory, no lost memory—all of this comes from GNM. It is IDES's **core technology** and the root of what makes IDES different from other agent architectures.

!!! tip "Further reading"
    To learn more about **Boundless NO_SESSION** and **Scroll SCROLLS**, check out the **Boundless** and **Scroll Context** sections on the official website.
