---
name: backlog-to-spec
version: 1.1.0
description: v1.1.0｜Use when the user wants to push a backlog entry toward a formal spec — phrases like "这条backlog可以做spec了"、"把这条交棒出去写规格"、"给这条立spec"、"这条该进设计了"、"hand this off to spec"、"turn this backlog item into a spec". Seedbed's 🧺 harvest step (route A) — detects which spec-driven tool the user has installed (Matt Pocock skills / Superpowers / Spec-Kit / OpenSpec / Task Master), lets them choose (or recommends installing Matt Pocock skills if none), packs the entry's context into that tool's expected input, and gives exact startup commands. Routing only — it NEVER writes the spec itself or takes over execution. Do NOT use to hand off to implementation (backlog-to-implementation), to tidy the pool (groom-backlog), or to promote an idea (idea-to-backlog).
---

# backlog-to-spec 🧺 (harvest → 规格)

## Overview

从 backlog 池挑一条**边界已清楚**的条目，交棒给用户**已安装**的 spec 驱动工具出规格。Seedbed 在这里是**生态路由器**：探测装了什么 → 让用户选 → 把条目打包成那个工具期望的输入 → 给出确切起步命令——然后停手。

路由引擎（探测清单 / 分支规则 / 起步命令 / 打包字段 / 回写）**全部在 [`../../HANDOFF.md`](../../HANDOFF.md)**，本 skill 不复制。数据约定见 [`../../CONVENTIONS.md`](../../CONVENTIONS.md)。

## When to Use

- 某条 backlog 状态到了 `Ready for spec`，或用户明说"这条可以做 spec 了"。
- grooming / 回顾中用户点名某条"该进设计了"。

## When NOT to Use

- 要直接推向**实现**（已有 spec 或小改动）→ `backlog-to-implementation`。
- 条目还没进 backlog 池 → 先 `idea-to-backlog`。
- 条目问题/边界还不清楚 → 先补事实（`Needs research`），别硬交棒。

## 第 0 步：检查更新（每次运行都做）

进入下面的正式流程之前，先运行 skill 目录下的：

```bash
scripts/check_update.sh
```

- 退出码 `0`：直接进入下一步，**不要**向用户复述脚本输出。
- 退出码 `10`：把脚本打印的报告**原样转述给用户**，并询问是否现在拉取。
  - 用户同意 → 运行 `scripts/check_update.sh --pull`，成功后按新版本继续；失败时把脚本给出的拒绝原因转述给用户，然后**按当前版本继续本次任务**，不要卡在更新上。
  - 用户拒绝或不理会 → 按当前版本继续，本次任务内不再提更新。
- 用户说「关掉自动检查更新」→ 往 `~/.config/backlog-to-spec/.env` 写 `AUTO_UPDATE_CHECK=0`（该文件已存在则只改 / 追加这一行，不动其他行）。

**更新检查永远不是任务的阻塞项**：检查失败、拉取失败、用户不理会，一律落到「按当前版本继续干活」。

## Flow

1. **解析数据根**（CONVENTIONS §1.1）：含 `target:` 指针跟一跳，再按 `root:` 定位项目内自定义数据目录（如 docs/backlogs）；代管模式下条目在**目标项目**的池里，下游工具的起步也要在目标项目执行。
2. **定位条目**：确认用户指的是哪条（读 `BACKLOG.md` 未决区；歧义让用户选）。
3. **探测**（HANDOFF §2）：CLI（`command -v specify openspec task-master`）+ 插件注册（`~/.claude/plugins/installed_plugins.json`）+ skill 目录 + 项目内标志，三类全查。
4. **分支**（HANDOFF §3）：多个→让用户选（有项目内标志者优先展示）；1 个→直接用；0 个→**推荐安装 Matt Pocock skills**（`npx skills@latest add mattpocock/skills`），或用户另选。
5. **打包 + 起步**（HANDOFF §4–§5）：把条目的问题 / 期望 / 事实依据 / 验收 / 依赖翻译成所选工具的输入，连同该工具的确切起步命令一并交给用户（如 `/to-spec`、`/speckit.specify`、`/opsx:propose`）。
6. **回写**（HANDOFF §6）：`产物链接` 回填、状态 `Planned`、跑 `reindex.mjs`、向用户复述"交给了谁、从哪开始"。

## CRITICAL

- **只路由不执行**（HANDOFF §1 红线）：不替下游写 spec、不调度 agent、不追进度。讲到"从哪条命令开始"为止。
- **工具选择权在用户**：多候选必须让选；零安装时推荐而非擅自替用户装。
- **条目不离开池**：标 `Planned` + 链产物，本体不搬空——记忆层不删。
- **起步命令以 HANDOFF 表为准**，表中两处标 ⚠️ 的（Superpowers 斜杠格式、OpenSpec 命令文件）运行时实测，别照本宣科。
- **代管模式提醒**：起步命令要在**目标项目**里执行，不是当前工作台。
