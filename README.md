# Seedbed 🌱

**A decision-memory & idea-incubator for AI coding agents — not another task runner.**

Seedbed 把你的想法当**种子**，不当待办。看到一个点子、一篇文章、一条视频，随手撒进苗床；过些天回来打理——壮的移栽进 backlog，弱的继续育，蔫的沤肥（但绝不扔）。到该动手时，Seedbed 把成熟的苗**交棒**给你已经装好的 spec / 实现工具（Matt Pocock skills、Superpowers、Spec-Kit…），自己**只路由、不执行**。

> 现有 AI backlog 工具都是「任务执行队列」（领→做→关）。Seedbed 是它们的**上游**：一层会孵化、能回溯、永不删的**决策记忆**。

## 心智模型：两个池，各是「入口 → 回顾 → 出口」

```
🌱 ideas 池      capture-idea → review-ideas → idea-to-backlog
🪴 backlog 池    idea-to-backlog → groom-backlog → backlog-to-spec ∥ backlog-to-implementation
🧺 交棒                                    ↓ 探测你已装的下游工具，只路由不执行
                                    spec 生成器 / 代码执行器
```

**没有一步是「记完自动流到下一层」的**——每层都是囤着存量的池，靠你「找时间回顾」驱动，源条目永不删。

## Skills

| skill | 花名 | 做什么 |
|---|---|---|
| `capture-idea` | 🌱 sow | 零摩擦记一个想法（灵感 / 文章 / 视频），当场不处理 |
| `review-ideas` | 🌿 tend | 找时间批量回顾 ideas 池，逐条分流：成熟 / 继续养 / 放弃 |
| `idea-to-backlog` | 🪴 transplant | 把成熟想法移栽成 backlog 正式条目（追根因 + 补验收） |
| `groom-backlog` | ✂️ prune | 整理 backlog 池：合并 / 拆分 / 排序 / 状态流转 |
| `backlog-to-spec` | 🧺 harvest | 探测你装的 spec 工具（Matt Pocock skills / Spec-Kit / OpenSpec…），交棒出规格 |
| `backlog-to-implementation` | 🧺 harvest | 先看有没有 spec，再交棒给执行器落地（`/speckit.implement`、`/opsx:apply`…） |

交棒路由引擎（探测信号 + 各工具确切起步命令，已核实）见 [`HANDOFF.md`](./HANDOFF.md)。

> 命令名是功能直白名，花名只用于叙事——好用 + 好记两不耽误。

## 版本与 Release

各目标的当前版本与对应 Release（本节由 `harness/repo-harness/release-on-push.sh --table` 生成，升版本的提交须同步更新，约定见外层仓 `docs/adr/0009`）：

<!-- release-table:begin -->
| 目标 | 版本 | Release |
|---|---|---|
| backlog-to-implementation | 1.0.1 | [backlog-to-implementation/v1.0.1](https://github.com/cookaihq/seedbed/releases/tag/backlog-to-implementation%2Fv1.0.1) |
| backlog-to-spec | 1.0.1 | [backlog-to-spec/v1.0.1](https://github.com/cookaihq/seedbed/releases/tag/backlog-to-spec%2Fv1.0.1) |
| capture-idea | 1.0.1 | [capture-idea/v1.0.1](https://github.com/cookaihq/seedbed/releases/tag/capture-idea%2Fv1.0.1) |
| groom-backlog | 1.0.1 | [groom-backlog/v1.0.1](https://github.com/cookaihq/seedbed/releases/tag/groom-backlog%2Fv1.0.1) |
| idea-to-backlog | 1.0.1 | [idea-to-backlog/v1.0.1](https://github.com/cookaihq/seedbed/releases/tag/idea-to-backlog%2Fv1.0.1) |
| review-ideas | 1.0.1 | [review-ideas/v1.0.1](https://github.com/cookaihq/seedbed/releases/tag/review-ideas%2Fv1.0.1) |
<!-- release-table:end -->

## 安装

把全部 skill 装进某个项目（Claude 与 Codex 双引擎同时可用）：

```bash
node scripts/install.mjs /path/to/your-project          # 复制模式：拷贝自包含产物
node scripts/install.mjs /path/to/your-project --link   # 软链模式：软链到本仓 dist/
```

安装器先把每个 skill 构建成**自包含产物**（`dist/<name>/`：共享的 CONVENTIONS/HANDOFF 进 `references/`、索引脚本进 `scripts/`，相对链接自动改写），再装到项目的 `.claude/skills/` 与 `.codex/skills/`。两种模式都幂等可重复跑：

- **复制**：项目拿到独立副本，与本仓解耦；遇到软链（如 AgentShell 注册表管理的技能）跳过不覆盖。
- **软链**（`--link`）：多个项目共享同一份 `dist/` 产物；seedbed 源改动后**重跑一次本脚本**重建 dist，所有软链项目同时生效。

## 数据

全部是你项目里 `.seedbed/` 下的纯 Markdown，一条一文件，进你自己的 git。约定见 [`CONVENTIONS.md`](./CONVENTIONS.md)，设计依据见 [`DESIGN.md`](./DESIGN.md)。

**多项目工作区 / 代管模式 / 自定义数据目录**：cwd 不是单一项目？skill 会解析该写进哪个项目的 `.seedbed/`（歧义时问你）。想用一个专门的工作台项目打理另一个项目的 backlog？在工作台的 `.seedbed/config.yml` 放一行 `target: /path/to/目标项目`——数据与上下文都在目标项目，目标项目自己零改动。想让池子住进项目自己的文档区（比如 `docs/backlogs/`）？在 `.seedbed/config.yml` 放一行 `root: docs/backlogs`——`.seedbed/` 只留作发现锚点，数据搬去你指定的目录（机制类似 git worktree 的 `.git` 指针文件）。

## 状态

原型阶段（v1 = ideas 池闭环）。方向与决策记录在 `DESIGN.md`。
