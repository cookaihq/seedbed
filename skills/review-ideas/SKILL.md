---
name: review-ideas
version: 1.2.0
description: >-
  v1.2.0｜Use when the user wants to sit down and go through their captured ideas in a batch and sort them — phrases like "回顾一下我记的想法"、"整理下idea"、"看看之前存的点子"、"过一遍ideas池"、"idea grooming"、"review my ideas"、"triage my notes". Seedbed's 🌿 tend step — walks the ideas pool (.seedbed/ideas/), and for each open idea decides one of three: mature → hand to idea-to-backlog, not-ready → keep Brewing, abandon → Dropped (with reason, never deleted). Do NOT use to capture a single new idea (that's capture-idea) or to groom the backlog pool (that's groom-backlog).
---

# review-ideas 🌿 (tend)

## Overview

**找一个时间批量打理 ideas 池**——这是捕获之外的另一个独立时段。逐条过 `.seedbed/ideas/` 里**未决**（Inbox/Brewing）的想法，给每条做**三态分流**：

- **成熟**（长出了具体场景 + 用户价值 + 可验证）→ 走 `idea-to-backlog` 移栽进 backlog。
- **不成熟**（还只是方向 / 直觉）→ 保持 `Brewing`，继续养。
- **放弃**（不再符合方向）→ 标 `Dropped` 并**写原因**（不删）。

这正是 Seedbed「非连续」的核心：想法不是记完就流转，而是攒着、等你**找时间回顾**才分流。约定见 [`../../CONVENTIONS.md`](../../CONVENTIONS.md) §3。

## When to Use

- 用户说"我来整理 / 回顾一下之前记的想法"。
- 攒了一批 idea，用户想集中过一遍、决定哪些值得推进。
- 定期（每周 / 每个版本收口）做想法 grooming。

## When NOT to Use

- 只是要**记一条新想法** → `capture-idea`。
- 要**整理 backlog 池**（合并 / 排序 / 状态流转）→ `groom-backlog`。
- 已经认定某条成熟、只想**转成 backlog** → 直接 `idea-to-backlog`。

## 第 0 步：检查更新（每次运行都做）

进入下面的正式流程之前，先运行 skill 目录下的：

```bash
scripts/check_update.sh
```

- 退出码 `0`：直接进入下一步，**不要**向用户复述脚本输出。
- 退出码 `10`：把脚本打印的报告**原样转述给用户**，并询问是否现在拉取。
  - 用户同意 → 运行 `scripts/check_update.sh --pull`，成功后按新版本继续；失败时把脚本给出的拒绝原因转述给用户，然后**按当前版本继续本次任务**，不要卡在更新上。
  - 用户拒绝或不理会 → 按当前版本继续，本次任务内不再提更新。
- 用户说「关掉自动检查更新」→ 往 `~/.config/review-ideas/.env` 写 `AUTO_UPDATE_CHECK=0`（该文件已存在则只改 / 追加这一行，不动其他行）。

**更新检查永远不是任务的阻塞项**：检查失败、拉取失败、用户不理会，一律落到「按当前版本继续干活」。

## Flow

1. **解析数据根**（CONVENTIONS §1.1）：cwd 向上找 `.seedbed/`；含 `target:` 指针就跟一跳（代管模式——回顾的是**目标项目**的池），再按 `root:` 定位项目内自定义数据目录（如 docs/backlogs）；多项目工作区歧义时先和用户确认过哪个项目的池。
2. 读 `<数据根>/IDEAS.md`（索引在 `.seedbed/` 根；或直接列 `ideas/`），聚焦**未决**（Inbox/Brewing）条目。
3. 逐条向用户复述这条想法，问/判断走哪一态——**分流决定权在用户**，尤其"成熟与否"别替用户拍板。
4. 落状态：成熟 → 触发 `idea-to-backlog`（本条随后转 `Promoted`）；不成熟 → `Brewing`；放弃 → `Dropped` + 原因。
5. 跑一次 `reindex.mjs --skill review-ideas` 刷新 `IDEAS.md`。

## CRITICAL

- **不删**：放弃走 `Dropped` + 写原因，绝不物理删除（记忆层留档）。
- **成熟的必须走 idea-to-backlog**，不要在本 skill 里直接手写 backlog 条目——那样会跳过 backlog 该有的查重 + 追根因门槛。本 skill 只**分流**，移栽的重活交给 `idea-to-backlog`。
- **批量、逐条、可中断**：一次没过完没关系，reindex 幂等，下次接着过。
- **尊重用户判断**：三态里"成熟 / 不成熟"是决策项，复述清楚让用户定，不擅自 Promote 或 Drop。

## 索引脚本的配置读取

调用共享 `reindex.mjs` 时传 `--skill review-ideas`。未显式传 `<数据根>` 时，`SEEDBED_ROOT` 按进程环境变量 → `$PWD/.env.review-ideas` → `$PWD/.env.local` → `$PWD/.env` 取首个非空值；都未配置时使用原来的 `.seedbed`。文件只读当前调用目录，不做 shell 展开，也不读其他 Skill 的专属文件或 home 配置。已明确的数据根参数优先于这些配置。安装产物内的脚本也固定了该 Skill 名。
