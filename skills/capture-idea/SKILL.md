---
name: capture-idea
version: 1.0.0
description: v1.0.0｜Use when the user wants to jot down a raw idea, spark, or something worth remembering later WITHOUT acting on it now — phrases like "记个想法"、"记一下这个idea"、"看到篇文章想存个点子"、"这个视频给我个灵感"、"先记下来别丢了"、"capture this idea"、"note this down for later". Seedbed's 🌱 sow step — drops the idea into the ideas pool (.seedbed/ideas/) with near-zero friction, then stops. Do NOT use to start building, to write a spec, to turn an idea into a backlog item (that's idea-to-backlog), or to look up existing notes — capture only writes a new idea, it never acts on it.
---

# capture-idea 🌱 (sow)

## Overview

把一个想法**零摩擦**记进 ideas 池（`.seedbed/ideas/`），**当场不处理**。想法可能来自灵感、一篇文章、一条视频、自媒体内容——此刻用户只想"别丢了"，不是要立刻做。

这是 Seedbed 苗床的**播种**动作：撒下种子，之后由 `review-ideas` 找时间回顾、分流。捕获阶段刻意**不查重、不追根因、不评估**——门槛越低，越不会因为"懒得记"而丢失想法。

字段与目录约定见 [`../../CONVENTIONS.md`](../../CONVENTIONS.md) §2–§3。

## When to Use

- 用户冒出一个点子，想先存下来，没打算现在动手。
- 用户看到外部内容（文章 / 视频 / 帖子）觉得"这个思路可以借鉴"。
- 用户用 App / 干活时冒出"要是……就好了""这里怪怪的"，够不上正式 bug/需求。

## When NOT to Use

- 用户想**现在就做**这件事 → 不是捕获，直接进相应工作流。
- 用户想把某个想法**转成正式 backlog**（追根因、补验收）→ 用 `idea-to-backlog`。
- 用户想**回顾 / 整理**已记的想法 → 用 `review-ideas`。
- 用户在**查询**已有笔记 → 直接读 `.seedbed/ideas/IDEAS.md`，不是本 skill。

## Flow

1. **解析数据根**（CONVENTIONS §1.1）：cwd 向上找 `.seedbed/`；config 含 `target:` 就跟一跳（代管模式），再按 `root:` 定位项目内自定义数据目录（如 docs/backlogs）；多项目工作区里找不到 → 扫子目录 + 结合对话推断这条 idea 属于哪个项目并**向用户确认**，不擅自在工作区根新建。
2. 选类型：Spark(⚡) / Bet(🎯) / Reference(🔖，**必附来源链接**) / Observation(🔍)。
3. 在 `<数据根>/ideas/` 新建 `YYYY-MM-DD-<slug>.md`（英文 kebab slug；撞名加 `-2`），按 CONVENTIONS §3 的 5 字段轻模板填写，状态默认 `Inbox`。
4. 跑一次 `node <seedbed>/scripts/reindex.mjs <数据根>` 刷新 `IDEAS.md`（若配了保存后自动重跑的 hook 则免）。
5. 回报：告诉用户这条在 `IDEAS.md` 里的**中文标题**，方便日后定位（文件名是英文 slug、不便辨认）。

## CRITICAL

- **零摩擦**：不查重、不追根因、不逼用户补全。缺的字段留空，别拦着用户。唯一硬规则见下。
- **来源不编造**：Reference（借鉴）类**必须**附真实来源链接；任何具体数值不臆测。宁可写"待核实"。
- **只写不做**：capture 只新建一条 idea 文件，**绝不**顺手开始实现、写 spec、或改别的文件。
- **只新建自己的文件**：一条一文件，不碰他人条目、不手改 `IDEAS.md`（它是 reindex 的派生物）。
- **默认状态 Inbox**：交给后续 `review-ideas` 分流，别在捕获时替用户判断成熟度。
