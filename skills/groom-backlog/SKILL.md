---
name: groom-backlog
version: 1.0.1
description: v1.0.1｜Use when the user wants to tidy up their backlog pool in a batch — phrases like "整理下backlog"、"backlog grooming"、"过一遍backlog"、"合并重复的条目"、"重新排下优先级"、"版本规划前收拾一下待办池"、"groom the backlog". Seedbed's ✂️ prune step — walks the backlog pool (.seedbed/backlog/), merging duplicates, splitting oversized entries, updating statuses, filling in Impact/Confidence/Effort/Priority, marking Dropped with reasons. Do NOT use to review raw ideas (that's review-ideas), to add a new entry (capture-idea / idea-to-backlog), or to hand an entry off to spec/implementation tools (backlog-to-spec / backlog-to-implementation).
---

# groom-backlog ✂️ (prune)

## Overview

**批量整理 backlog 池**——对应园艺里的修剪：不种新苗、不收获，只让池子保持可决策的形状。典型时机：进版本规划前、大功能收口后、或池子明显长草时。

动作清单（按条目逐个判断，不是每次全做）：

- **合并重复**：同一问题的多条并进主条目（唯一允许删文件的场景，见 CRITICAL）。
- **拆分过大**：一条覆盖多个无依赖模块 / 混着 bug 和新功能 → 拆成可独立排期的多条。
- **状态流转**：该调研的标 `Needs research`、边界清楚的标 `Ready for spec`、不再符合方向的标 `Dropped`（写原因）、用户确认已落地的标 `Done`。
- **补评估维度**：给近期候选补 Impact / Confidence / Effort / Priority（拿不准留空，**不编造**）。

约定见 [`../../CONVENTIONS.md`](../../CONVENTIONS.md) §4、§6。

## When to Use

- 用户说"整理 / 收拾一下 backlog"、"版本规划前过一遍"。
- 池里出现明显重复、或多条长期没动过状态。

## When NOT to Use

- 回顾**想法池** → `review-ideas`（那是 ideas 的活）。
- 记新条目 → `capture-idea` / `idea-to-backlog`。
- 把某条推向 spec / 实现 → `backlog-to-spec` / `backlog-to-implementation`（grooming 里发现"这条该做了"时，可以顺手建议用户走交棒，但交棒本身不在本 skill 内做）。

## Flow

1. **解析数据根**（CONVENTIONS §1.1）：cwd 向上找 `.seedbed/`；含 `target:` 指针跟一跳（代管模式——整理的是**目标项目**的池），再按 `root:` 定位项目内自定义数据目录（如 docs/backlogs）。
2. 读 `<数据根>/BACKLOG.md`（索引在 `.seedbed/` 根），重点过**未决**区（Backlog / Needs research / Ready for spec / Planned）。
3. 逐条检查：重复？过大？状态过时？缺评估维度？——把发现分成**可直接执行**（如明确重复的合并）与**需用户决策**（如方向性取舍、Dropped 判定），后者逐条向用户确认。
4. 执行改动：改各条目自己的文件；合并时把被并条目内容全量并进主条目、互链后**删除被并文件**。
5. 跑 `reindex.mjs` 刷新 `BACKLOG.md`。
6. 汇报：合并了什么、拆了什么、改了哪些状态、哪些条目建议尽快交棒。

## CRITICAL

- **不删是铁律，合并是唯一例外**：只有"确认重复、且内容已全量并入主条目"的冗余副本可以删文件（决策上下文不丢，删除只是去重）。其余一律 `Dropped` + 原因。
- **Dropped / Done 是决策项**：判"不做了"或"已完成"必须用户确认，不擅自定。
- **数字不编造**：Impact/Confidence/Effort 拿不准就留空或问，不臆测填值。
- **不顺手交棒、不顺手实现**：grooming 只整理池子；发现该做的条目，建议用户走 `backlog-to-spec` / `backlog-to-implementation`，本 skill 不越界。
- **不手改 `BACKLOG.md`**：它是 reindex 的派生物。
