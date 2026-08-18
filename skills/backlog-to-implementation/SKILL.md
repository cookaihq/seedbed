---
name: backlog-to-implementation
version: 1.0.1
description: v1.0.1｜Use when the user wants to push a backlog entry toward actual implementation — phrases like "这条可以开始做了"、"把这条交棒去实现"、"开始实现这条backlog"、"这条动手吧"、"implement this backlog item"、"hand this off for implementation". Seedbed's 🧺 harvest step (route B) — first checks whether the entry already has a spec (via its 产物链接 field): has one → route to an installed executor (Spec-Kit /speckit.implement, OpenSpec /opsx:apply, Task Master, Matt Pocock /implement, Superpowers executing-plans, or the current agent as fallback); none → asks the user to either run backlog-to-spec first or, for small changes, skip spec and hand the entry itself over. Routing only — it NEVER implements or dispatches agents itself. Do NOT use to produce a spec (backlog-to-spec) or to tidy the pool (groom-backlog).
---

# backlog-to-implementation 🧺 (harvest → 代码)

## Overview

从 backlog 池挑一条推向**实现**。与 `backlog-to-spec` 共用同一台路由引擎（[`../../HANDOFF.md`](../../HANDOFF.md)），只多一个前置分流：先看这条**有没有 spec**——池里的条目本就深浅不一（有的已出过规格、有的还是裸条目），两条路由**并列、独立触发**，不是先 spec 后实现的固定流水线。

## When to Use

- 某条 backlog 已有 spec（`产物链接` 非空），用户说"可以开始做了"。
- 小改动，用户想跳过正式 spec 直接实现。

## When NOT to Use

- 要出**规格**而非代码 → `backlog-to-spec`。
- 条目还不在 backlog 池 → 先 `idea-to-backlog`。
- 用户只是问"这条做到哪了"→ 读条目 `产物链接` 回答即可，进度归下游工具管，不归 Seedbed。

## Flow

1. **解析数据根**（CONVENTIONS §1.1）：含 `target:` 指针跟一跳，再按 `root:` 定位项目内自定义数据目录（如 docs/backlogs）；代管模式下起步命令要到**目标项目**执行。
2. **定位条目**（歧义让用户选）。
3. **spec 状态分流（本路由独有的第 0 步）**：读条目 `产物链接`——
   - **已有 spec** → 进第 4 步，且**优先推荐产出该 spec 的同一工具**接着做（一条龙：Spec-Kit 的 spec 用 `/speckit.implement`，OpenSpec 的 change 用 `/opsx:apply`……）。
   - **没有 spec** → 停下问用户二选一，**不擅自跳过设计**：① 先走 `backlog-to-spec` 补规格再回来；② 改动够小，把条目本身（问题 / 期望 / 验收）当轻量输入直接实现。
4. **探测执行器**（HANDOFF §2 + 表中"实现起步"列）：已装的 Spec-Kit / OpenSpec / Task Master / Matt Pocock（`/implement`）/ Superpowers（`executing-plans`）；**当前 agent 是永远可用的兜底**。
5. **分支**（HANDOFF §3）：多个→让用户选；1 个→直接用；0 个专用执行器→提议"当前会话直接按条目/spec 实现"——用户同意后，那就是一个普通编码任务，**已在 Seedbed 职责之外**。
6. **打包 + 起步**（HANDOFF §4–§5）：spec/tasks 位置 + 验收标准 + 依赖顺序（或轻量路径的条目本身），连同确切起步命令交给用户。
7. **回写**（HANDOFF §6）：`产物链接` 补实现侧信息、状态保持 `Planned`、跑 `reindex.mjs`。**不标 `Done`**——落地与否由用户日后确认。

## CRITICAL

- **只路由不执行**（HANDOFF §1 红线）：本 skill 自己不写一行实现代码、不派 agent、不追进度。兜底路径也只是"提议由当前会话接手"，接手后的编码不属于本 skill。
- **无 spec 不擅断**：跳过 spec 是用户的决定（第 3 步二选一），不是默认路径。
- **一条龙优先**：已有 spec 时优先推荐产出它的同一工具继续，减少上下文搬运损耗。
- **记忆层不追执行进度**：交棒即 `Planned`，`Done` 等用户确认；下游做到哪一步不镜像回池。
- **代管模式提醒**：起步命令在**目标项目**执行。
