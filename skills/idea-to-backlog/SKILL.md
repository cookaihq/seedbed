---
name: idea-to-backlog
version: 1.0.1
description: v1.0.1｜Use when a captured idea has matured and the user wants to turn it into a proper backlog item — phrases like "把这个想法转成backlog"、"这个idea可以做了"、"给这个点子立项"、"这个想法成熟了，正式记一条"、"promote this idea"、"move this to backlog". Seedbed's 🪴 transplant step — the exit of the ideas pool and the entrance of the backlog pool. Runs the real gate: dedup search + root-cause + acceptance criteria, writes a full backlog entry, marks the source idea Promoted (kept, cross-linked). Do NOT use to capture a fresh idea (capture-idea), to batch-review ideas (review-ideas), or to hand a backlog item to a spec/impl tool (backlog-to-spec / backlog-to-implementation).
---

# idea-to-backlog 🪴 (transplant)

## Overview

把一条**成熟的想法**移栽成 backlog 池里的**正式条目**。这是 ideas 池的**出口**、backlog 池的**入口**——门槛在这里陡然升高：从 5 字段轻想法，升级成带**追根因、数据链路、可验证验收**的完整 backlog 条目。

源想法**不删**：标 `Promoted` 留档，与新 backlog 条目**双向互链**（那条想法"当初长什么样"有回溯价值）。约定见 [`../../CONVENTIONS.md`](../../CONVENTIONS.md) §4。

## When to Use

- `review-ideas` 分流时判定某条想法成熟，要移栽。
- 用户直接说"这个想法可以做了 / 立项 / 正式记一条 backlog"。

## When NOT to Use

- 想法还不成熟 → 留 `Brewing`（`review-ideas` 处理），别硬移栽。
- 只是记一条新想法 → `capture-idea`。
- backlog 条目要交棒给 spec / 实现工具 → `backlog-to-spec` / `backlog-to-implementation`（v1.1）。

## Flow

1. **解析数据根**（CONVENTIONS §1.1）：cwd 向上找 `.seedbed/`；含 `target:` 指针就跟一跳（代管模式），再按 `root:` 定位项目内自定义数据目录（如 docs/backlogs）。**上下文根 = 数据根所在项目**——代管模式下，查重与追根因都去**目标项目**做，不是当前工作台。
2. **查重**：`rg <关键词> <数据根>/backlog/`，按「模块 / 症状 / 数据链路」三角度搜，确认不是已有条目（是则并入、不新建）。
3. **追根因**：不停在"想做什么"，追问"用户遇到的现象，背后真正成因是哪一层（需求 / 流程 / 数据结构）？"——读**上下文根项目**的代码求证。先写**问题**，不先写方案。
4. **写条目**：在 `<数据根>/backlog/` 新建 `YYYY-MM-DD-<slug>.md`，按 CONVENTIONS §4 完整模板填写；`来源` 写"想法毕业"并链源 idea；关键事实不清写"待核实"，**不编造**。
5. **回链源想法**：源 idea 状态改 `Promoted`，加一行链到新 backlog 条目。
6. 跑 `reindex.mjs` 刷新 `IDEAS.md` + `BACKLOG.md`。
7. 回报新 backlog 条目的**中文标题**。

## CRITICAL

- **这是门槛所在**：查重 + 追根因 + 可验证验收三样是移栽的硬门槛，别图快跳过——backlog 池的价值全靠这道闸守住。
- **双向互链**：源 idea ↔ 新 backlog 条目互相链接；源 idea 标 `Promoted`、**不删**。
- **数字 / 事实不编造**：Impact/Confidence/Effort 等拿不准就留空或"待核实"，不臆测填值。
- **先问题后方案**：`问题` 字段写现象与影响，别把未验证的方案当结论写进去。
- **一条一文件**：只新建自己的 backlog 文件 + 改源 idea 那一条，不手改 `BACKLOG.md`（reindex 派生）。
