# Seedbed 交棒路由引擎（HANDOFF）

> `backlog-to-spec` 与 `backlog-to-implementation` **共用**的路由内核：探测 → 分支 → 打包 → 起步指令。两个 skill 只提供参数（探测哪类工具、打包什么上下文），骨架在此、不各写一套。设计依据见 `DESIGN.md` §5.5。
>
> 下表探测信号与起步命令核实于 2026-07-14（官方仓库 README / 文件树 + 本机实测）。工具更新快，**探测时以运行时实测为准**；两处遗留存疑已标注。

## 1. 红线（先读这个）

无论哪条路由：**只做「路由 + 上下文打包 + 起步指令」**。绝不自己调度 agent、不追踪实现进度、不接管执行——讲到「从哪条命令开始」为止。交棒后条目标 `Planned` + 回填 `产物链接`，**不搬空、不离开池**；直到用户确认落地才手动标 `Done`。

## 2. 探测清单（已核实）

按顺序做三类检查（都便宜，全做）：

1. **CLI**：`command -v specify openspec task-master`。
2. **Claude Code 插件**：读 `~/.claude/plugins/installed_plugins.json` 的 `plugins` 字典，键格式 `name@marketplace`（本机实测，如 `codex@openai-codex`）——查含 `superpowers` / `mattpocock` 的键；辅证 `~/.claude/plugins/known_marketplaces.json`。
3. **skill 目录与项目标志**：`~/.claude/skills/<name>/` 与项目 `.claude/skills/<name>/`（skills.sh 装法）；项目内 `.specify/`、`openspec/`、`.taskmaster/`。

| 下游工具 | 全局探测信号 | 项目内标志 | 角色 |
|---|---|---|---|
| **Matt Pocock skills**（默认推荐） | 项目/全局 `.claude/skills/to-spec/`（skills.sh：`npx skills@latest add mattpocock/skills`，`-g` 装全局）；或 `installed_plugins.json` 含 mattpocock 条目（插件装法） | 无独立 spec 目录约定 | spec + 实现 |
| **Superpowers**（obra） | `installed_plugins.json` 含 `superpowers@…`（`/plugin install superpowers@claude-plugins-official` 或 obra/superpowers-marketplace） | 无 | spec(计划) + 实现 |
| **GitHub Spec-Kit** | PATH 有 `specify`（`uv tool install specify-cli --from git+https://github.com/github/spec-kit.git`） | `.specify/` + `specs/`（`specify init` 产生） | spec + 实现 |
| **OpenSpec** | PATH 有 `openspec`（`npm i -g @fission-ai/openspec`） | `openspec/`（specs/ + changes/，`openspec init` 产生） | spec + 实现 |
| **Task Master AI** | PATH 有 `task-master`（`npm i -g task-master-ai`）；或 MCP 配置含 `task-master-ai` | `.taskmaster/`（`task-master init` 产生） | spec(PRD) + 实现 |
| **当前 agent 兜底** | 运行环境即具备 | — | 仅实现 |

## 3. 分支决策（两条路由通用）

- 探测到**多个** → 列出让用户选（有项目内标志的排前——已在本项目初始化过的工具优先）。
- **恰好 1 个** → 直接用，简短告知。
- **0 个** → 推荐安装，**默认推荐 Matt Pocock skills**（`npx skills@latest add mattpocock/skills`），给安装指引，用户也可选其它；`backlog-to-implementation` 另有兜底：当前 agent 直接按条目/spec 实现（征得用户同意后按普通编码任务进行，已在 Seedbed 职责之外）。

## 4. 起步指令（已核实的确切命令）

交棒时把打包好的上下文连同**这个工具的起步序列**一并告诉用户：

| 工具 | spec 起步 | 实现起步 |
|---|---|---|
| Matt Pocock skills | `/to-spec`（把 backlog 条目内容作为输入喂给它） | `/to-tickets` 拆票 → `/implement`（超大工程 `/wayfinder`）。插件装法带前缀：`/mattpocock-skills:to-spec` |
| Superpowers | 自然语言触发 `brainstorming` → `writing-plans`（描述任务即可自动挂上） | `executing-plans` / `subagent-driven-development`。⚠️ 显式斜杠格式官方未写明（按插件规范应为 `/superpowers:writing-plans`），**运行时实测为准** |
| Spec-Kit | `/speckit.specify`（可前置 `/speckit.constitution`、`/speckit.clarify`；项目未 init 先 `specify init .`） | `/speckit.plan` → `/speckit.tasks` → `/speckit.implement` |
| OpenSpec | `/opsx:propose <要做什么>`（可前置 `/opsx:explore`；未 init 先 `openspec init`） | `/opsx:apply` → 完成后 `/opsx:archive`。⚠️ init 是否写入 `.claude/commands/` 未核实，斜杠不可用时以 `openspec` CLI 为准 |
| Task Master | 把条目整理成 PRD 文本 → `task-master parse-prd <prd文件>`（未 init 先 `task-master init`） | `task-master next` → `task-master show <id>` → 完成 `task-master set-status` |

## 5. 上下文打包

把 backlog 条目翻译成下游工具期望的输入，**逐字段对应、不重新发明**：

- **backlog-to-spec 打包**：问题（现象 + 影响谁）、期望行为 / 关键边界、事实依据（代码位置以符号名锚定）、验收标准、依赖（Blocked by）。→ 作为 `/to-spec`、`/speckit.specify`、`/opsx:propose` 的输入正文或 PRD 素材。
- **backlog-to-implementation 打包**：`产物链接` 里的 spec/tasks 位置 + 验收标准 + 依赖顺序；无 spec 走轻量路径时打包条目本身（问题 / 期望 / 验收）。
- 代管模式下，起步指令要提醒用户**到目标项目里执行**（下游工具的项目内标志、产物都在目标项目）。

## 6. 交棒后回写（两条路由通用收尾）

1. 条目 `产物链接` 回填：用了哪个工具、产物落在哪（spec 路径 / change 名 / task id）。
2. 状态改 `Planned`（已是 Planned 则保持）。
3. 跑 `reindex.mjs`。
4. 向用户复述：交给了谁、从哪条命令开始、Seedbed 的活到此为止。
