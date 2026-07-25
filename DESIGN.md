# Seedbed 🌱 · 设计稿（DESIGN）

> 状态：草案 v0.4（2026-07-14）。这是形态与数据模型的设计真相源，动手搭各 skill 前先在这里定清。
> **项目定名 Seedbed（苗床）**——想法是种子，撒进苗床、育苗、移栽、收获；种子壳与拔掉的苗都留在土里（记忆层不删）。目录 `seedbed/`。

## 0. 一句话定位

一组面向 AI coding agent 的 **skill**，以**两个常驻的决策记忆池**（ideas + backlog）为核心，把「捕获想法 → 回顾分流 → 按需交棒生产」串起来。Seedbed（苗床）叙事：**播种 → 育苗 → 移栽 → 收获交棒**。

**北极星**：它不是又一个 task runner / issue tracker，而是**AI 时代的产品决策记忆层 + 想法孵化器**——让灵光一现、看到的文章/视频、被否的方案、暂缓的债，都能被零摩擦捕获、逐步孵化、永久回溯。

**为什么这个定位**：现有 AI backlog 工具（Task Master、Beads、Backlog.md、Spec-Kit）全是「任务执行队列」——领任务→做→关闭。**没有一个把 backlog 当「长期决策记忆 + 想法孵化器」**（不删历史、Dropped 也留档、想法可孵化）。这是行业空位，也是本项目唯一的差异化。到「该动手生产」这一步，本项目**交棒**给那些工具，不与它们正面竞争——它是它们的**上游**。

---

## 1. 核心心智模型：记忆层 vs 工作层（本项目的第一性设计）

要解决的根源张力：参考实现（mattpocock 的 `to-tickets`）是**一次性工单**（tracer-bullet，做完即弃、序号=执行顺序）；而「决策记忆」要的是**长期留存、可回溯、不删**。一套结构承担两种相反用途会拧巴。所以**显式拆成两层**：

| | **记忆层（本项目主场）** | **工作层（交棒出去）** |
|---|---|---|
| 存什么 | 想法、决策、暂缓项、被否方案 | 可执行的 spec / tasks / 代码 |
| 生命周期 | **长期、不删**（Dropped 也存档） | **一次性、可弃**（做完归档/删） |
| 组织依据 | 决策价值（Impact/Confidence/…） | 执行依赖（Blocked by、拓扑序） |
| 谁是主用户 | 产品决策者（人）+ agent 辅助 | agent 执行者 |
| 归属 | `ideas/`、`backlog/`（本项目） | Spec-Kit / mattpocock / Superpowers 等下游工具 |

### 统一规律：每层都是常驻池，层间流转都非连续

**没有一步是「记完就自动流到下一层」的。** 捕获 idea、idea 进 backlog、backlog 交棒生产——每一层都是一个**囤着存量的池**，靠用户**找时间回顾**来驱动流转：

1. **回顾**（独立会话、批量、异步）：找个时间打开这个池，逐条过。
2. **分流**：每条判断——推向下游 / 留着继续养 / 放弃。
3. **投射**：被推走的条目**在源池留档不删**（标 `Promoted`/`Planned` + 链下游产物），只是状态变了。

所以这不是流水线，是「**池 + 异步回顾取货**」。三个池同构，每个都是「**入口 → 回顾分流 → 出口（投射，源条留档）**」：

```
  ideas 池      capture-idea(入) → review-ideas(顾:成熟/养/弃) → idea-to-backlog(出)
     │                                                                  │ 投射·源idea标Promoted
     ▼                                                                  ▼
  backlog 池    idea-to-backlog(入) → groom-backlog(顾) → backlog-to-spec ∥ -implementation(出)
     │                                                                  │ 交棒·探测路由
     ▼                                                                  ▼
  工作层        ───────────────────────────────────  spec 生成器 / 代码执行器（下游工具·一次性）

  记忆层 = ideas + backlog 两池，源条目永不删（标 Promoted/Planned + 链下游产物）。
  每层都靠「找时间回顾」驱动、非连续；本项目只到工作层门口交棒，不碰执行。
```

> 典型节奏：**捕获**随时随地（看到想法/文章/视频，零摩擦记下、当场不处理）；**回顾**是另找的一个专门时段，批量过池子、分流。两者天然错开——这正是「非连续」的由来。

---

## 2. 数据布局（一条一文件 + 自动索引）

沿用「一条一 markdown 文件」——从根上消除多 agent 并发写同一文件的冲突（这正是 Backlog.md / mattpocock 的做法，已被验证）。默认落在项目的 `.seedbed/`（或用户指定根）：

```
.seedbed/
├── IDEAS.md          # ideas 索引（勿手改）·突出未决态(Inbox/Brewing 在前, Promoted/Dropped 折叠)
├── BACKLOG.md        # backlog 索引（勿手改）·按优先级/状态突出未决态
├── ideas/            # 想法池：只放条目文件 YYYY-MM-DD-<slug>.md
├── backlog/          # 决策记忆池：只放条目文件（记忆层核心，不删）
├── images/           # 配图
└── config.yml        # 可选；含 target: 时 = 重定向指针（代管模式，本地无池）
```

> 索引在 `.seedbed/` 根、条目在池子目录——**索引与数据不同级**（2026-07-14 真机首用反馈修正：索引混在条目堆里翻起来碍事；与 agent-shell `docs/backlogs/` 的分级同构）。

> 注意：**没有 `specs/` 目录**——工作层产物（spec/tasks/代码）落在下游工具自己的位置，本项目只在 backlog 条目里**反向链接**它们（见 §5.5）。
>
> 两池都会累积 `Promoted`/`Planned`/`Done`/`Dropped` 的留档条目（记忆层不删）。防膨胀不靠删除，靠**索引默认突出未决态**——同一套机制，两池一致。

索引由脚本从目录整体重算、覆盖写（幂等、自愈）——沿用你现有 `gen-index.mjs` 的机制。

### 2.1 数据根解析与代管模式（2026-07-14 增，细则见 CONVENTIONS §1.1–§1.2）

要覆盖的三个真实场景：① cwd 是**多项目工作区**（如 `skills/awesome-skills`），得知道这条记录属于哪个项目；② 用户建了**代管项目**（如 AgentShell 项目目录）专门打理另一个项目的 backlog，数据要落到目标项目、上下文也要读目标项目；③ 项目要**自定义数据目录**（如 agent-shell 的 backlog 长期住 `docs/backlogs/`），不想把池放 `.seedbed/`。

三个场景收敛为**一个机制**：`解析算法 + 两级单向指针（target 跨项目 / root 项目内）`。

- **解析**（每个 skill 的第 0 步）：cwd 向上找 `.seedbed/` → config 含 `target:` 就跟**一跳**（跨项目，不许链，防环）→ 再读 `root:` 定数据居所（`<项目根>/<root>`，无则 `.seedbed/` 本身）→ 得到数据根 = 上下文根；工作区找不到就扫子目录 + 结合对话上下文推断 + **向用户确认**，不擅自在工作区根建。
- **root = 锚点与居所分离**（2026-07-14 增）：`.seedbed/` 永远是发现锚点（解析算法不变），`root:` 只挪数据住处、结构不变——与 target 互斥（代管侧只写 target，目标项目自己的 root 照常生效）。
- **代管 = 单向指针**：代管侧 `.seedbed/config.yml` 只放 `target:`（本地无池）；**目标侧零回链**——回链会把本机路径提交进目标 git（协作噪音 + 暴露本地结构 + 无人维护易过期）。目标项目自己跑 Seedbed 与被代管写的是同一个池，一条一文件天然消化双端并发。
- **先例**：git worktree 的 `.git` 文件（`gitdir:` 指针替代数据）；agent-shell 自己的可配置数据根（redirect 指针，已 shipped）。
- **数据根与上下文根暂不拆成两个字段**——两个场景里恒相等；真出现「数据在 A、读 B 代码」再拆（防 scope creep）。

---

## 3. Skill 清单（每个池：入口 / 回顾 / 出口）

参考 mattpocock 把 `to-spec` / `to-tickets` 拆开的做法，本项目是**一组动作导向的 skill**，不是单个 SKILL.md。按「哪个池、什么角色」组织，两池同构：

| skill | 池 | 角色 | 动作 | 门槛 |
|---|---|---|---|---|
| `capture-idea` | ideas | **入口** | 零摩擦记想法（来自灵感 / 文章 / 视频 / 自媒体），**当场不处理** | 极低：不查重、不追根因，只保「来源不编造」 |
| `review-ideas` | ideas | **回顾** | 找时间批量浏览 ideas 池，逐条分流：成熟→backlog / 不成熟→留养(Brewing) / 放弃→Dropped | 中：判断成熟度 |
| `idea-to-backlog` | ideas→backlog | **出口** | 把成熟 idea 投射成 backlog 正式条目；源 idea 标 `Promoted` 留档、互链 | 触发查重 + 追根因 + 补齐可验证验收 |
| `groom-backlog` | backlog | **回顾** | 整理：合并/拆分/排序/状态流转/补维度 | 中：需决策上下文 |
| `backlog-to-spec` | backlog→工作层 | **出口** | 探测 spec 生成器 → 交棒（见 §5.5） | 高：定方案 + 显式依赖 |
| `backlog-to-implementation` | backlog→工作层 | **出口** | 检测 spec 状态分流 → 探测执行器 → 交棒（见 §5.5） | 高：spec 就绪 or 明确跳过 |
| `reindex`（或内嵌进各 skill 收尾） | — | 贯穿 | 重算 `IDEAS.md` / `BACKLOG.md` | — |

> 对称性一目了然：**ideas 池** = capture-idea(入) + review-ideas(顾) + idea-to-backlog(出)；**backlog 池** = idea-to-backlog(入) + groom-backlog(顾) + backlog-to-spec/implementation(出)。`idea-to-backlog` 同时是 ideas 池的出口、backlog 池的入口。
>
> **Seedbed 花名（仅品牌 / README / 文案用；命令名仍是上面的功能名）**：capture-idea = 🌱 sow(播种)、review-ideas = 🌿 tend(打理苗床)、idea-to-backlog = 🪴 transplant(移栽)、groom-backlog = ✂️ prune(修剪)、backlog-to-spec/implementation = 🧺 harvest(收获交棒)。**功能名负责好用，花名负责好记**——花名不进 skill 的 `name`，只在对外叙事发力。

外加一份 **约定文档**（类似 mattpocock 的 `issue-tracker-local.md`）：定义目录结构、字段模板、状态机——各 skill 引用它，不各写一套。

> 每个 skill 遵循本仓 SKILL.md 格式：frontmatter 只 `name` + 详细 `description`（含触发短语、when-NOT），正文 Overview / When to Use / When NOT to Use / CRITICAL。

---

## 4. 字段模板

### 4.1 想法（`ideas/`）—— 轻模板（5 字段，刻意省略追根因）

```markdown
# YYYY-MM-DD · 一句话标题

- 类型：Spark(⚡速记) | Bet(🎯押注) | Reference(🔖借鉴,必附来源) | Observation(🔍洞察)
- 想法：一句话讲清它是什么
- 触发场景：当时为什么冒出来 / 从哪看到的（借鉴类必附来源链接，如那篇文章/那条视频）
- 隐约的价值：一句话直觉，不要求验证
- 状态：Inbox(新) | Brewing(在养) | Promoted(已升级→链 backlog) | Dropped(放弃,写原因)
```

> `review-ideas` 分流的三态就落在 `状态` 字段：成熟 → 走 `idea-to-backlog`（本条转 `Promoted`）；不成熟 → 保持 `Brewing`；放弃 → `Dropped`（写原因，不删）。

### 4.2 backlog（`backlog/`）—— 完整模板（决策记忆池门槛）

```markdown
# YYYY-MM-DD · 简短标题

- 状态：Backlog | Needs research | Ready for spec | Planned | Done | Dropped
- 类型：Bug | UX | Feature | Tech debt | Research
- 范围：影响的模块/流程/文件（未知写「待核实」）
- 来源：想法毕业(链 idea) / 用户反馈 / 验收 / 调研
- 问题：当前行为为什么不对，影响谁（先写问题，不先写方案）
- 期望行为 / 关键边界
- 事实依据：截图、日志、代码位置（以符号名+文件为锚）、相关链接
- 数据链路待核实：输入从哪来 / 哪层持有 / 下游怎么消费
- 值不值得做（Impact）：High | Medium | Low
- 有多大把握（Confidence）：High | Medium | Low
- 工作量（Effort）：S | M | L | XL
- 实现优先级（Priority）：High | Medium | Low
- 验收标准：可观察、可测试的完成条件
- 产物链接：交棒后回填——spec 在哪 / tasks 在哪 / 用了哪个下游工具（backlog-to-spec / -implementation 写入）
- 升级条件 / 依赖：触发交棒的条件；Blocked by: <其它条目 或 None>
```

> 字段大量沿用你 agent-shell 现有 backlog 规范（已跑通、有真实验证），本项目把它从一个仓的私有约定**抽成可分发的通用 skill**。`产物链接` 字段是交棒后回填的锚点，也是 `backlog-to-implementation` 判断「有没有 spec」的依据（见 §5.5 路由 B 第 0 步）。

---

## 5. 从行业借来的三点（含取舍）

调研（2026-07-14）显示，面向 agent 的 backlog 主流收敛到四特征：结构化字段 + 显式依赖图 + MCP/CLI 写接口 + 运行时现算索引。本项目的取舍：

1. **显式依赖字段**（学 Beads / mattpocock `Blocked by`）：**采纳**，但**只属于工作层**（记忆层按决策价值排，不按执行依赖）。
2. **索引现算 vs 静态生成**：**先静态生成**（脚本重算覆盖写，与你现有一致、零依赖），把「现算」列为未来可选增强。理由：记忆层读多写少，静态索引足够，且无重型基建。
3. **写入走 CLI/MCP 保元数据一致**（学 Backlog.md / Beads）：**先纯 skill 约定驱动**（agent 直接编辑文件），**放弃强制一致性**。理由：记忆层容错性高，写歪一个字段不会像执行依赖图那样崩；MCP 工具作为未来可选增强（要强一致再加）。

**一句话**：先做「约定驱动的纯 markdown skill 组」（低基建、易分发、对标 mattpocock），把 MCP / 现算索引 / 依赖图执行都留作未来增强——不在 v1 上重型基建。

---

## 5.5 交棒路由引擎（Handoff Routing）—— 两条并列路由：`backlog-to-spec` ∥ `backlog-to-implementation`

本项目**不自己实现工作层，也不自己写代码**，而是充当**生态路由器**：从 backlog 池挑一条，交棒给用户**已安装**的下游工具——可以推去 **spec 生成器**出规格，也可以推去 **代码执行器**落地。这让本项目保持「只管记忆层、不碰执行」的纯粹，同时优雅衔接现有生态、不重造轮子。

两条路由是**同一台参数化引擎**的两个实例，骨架相同：`探测 → 分支（多个让选 / 单个直接用 / 零个推荐安装）→ 交棒 + 给起步步骤`。区别只在「探测什么」和「打包什么上下文」。**两条并列、各自独立触发**——不是先 spec 后实现的固定顺序（见路由 B 第 0 步）。

> **2026-07-14 已实现**：引擎抽成仓库根 `HANDOFF.md`（两 skill 共同引用、不各写一套）；下面各表的探测信号与起步命令**已逐一核实**（官方仓库 + 本机实测——插件探测键 = `~/.claude/plugins/installed_plugins.json` 的 `plugins` 字典、格式 `name@marketplace`；`specify` CLI 实锤）。**运行时真相源以 `HANDOFF.md` 为准**，本节各表保留为设计意图快照。两处遗留存疑（Superpowers 显式斜杠格式、OpenSpec 是否写 `.claude/commands/`）已在 HANDOFF 标注"运行时实测为准"。

### 路由 A · `backlog-to-spec`（backlog → 规格）

**第 1 步 · 探测**已安装的 **spec 生成器**。多信号探测（skill 目录 + CLI + 项目内标志目录），候选清单如下——
> ⚠️ 下列每个「探测信号」的真实路径 / 命令名**须在实现时逐一核实**（跨 Claude Code / agent-shell / Cursor 环境位置不同），此处先列意图、不当既成事实：

| 下游工具 | 候选探测信号（待核实） | 类型 |
|---|---|---|
| **Matt Pocock skills**（默认推荐） | `~/.claude/skills/` 或 `.claude/skills/` 下存在 `to-spec` / `to-tickets` | skill |
| **Superpowers**（obra） | 存在 `writing-plans` / `executing-plans` skill；或插件市场标志 | 插件/skill |
| **GitHub Spec-Kit** | 项目内 `.specify/` 目录；或 `specify` CLI 可用 | CLI+脚手架 |
| **OpenSpec** | 项目内 `openspec/` 目录；或 `openspec` CLI | CLI+脚手架 |
| **Task Master AI** | 项目内 `.taskmaster/` / `tasks.json`；或 `task-master` CLI | CLI |
| **Agent OS / Kiro / 其他** | 各自标志目录（如 `.kiro/specs/`） | 视情况 |

**第 2 步 · 分支决策**：
- 探测到 **多个** → **让用户选**让谁接棒。
- 探测到 **恰好 1 个** → 直接用它（简短告知即将用它接棒）。
- 探测到 **0 个** → **推荐安装，默认推荐 Matt Pocock skills**，给出安装指引；用户也可选其它。

**第 3 步 · 交棒 + 给起步步骤**：无论走哪条，交棒后**必须明确告诉用户「在选定的工具里接下来怎么开始」**——把本条 backlog 的「问题 / 期望行为 / 验收 / 依赖」整理成该工具期望的输入，并给出具体起步指令。例如：
- 交给 **Matt Pocock skills**：提示先触发 `to-spec` 生成 spec、再 `to-tickets` 拆工单，并把本条目内容作为输入。
- 交给 **Spec-Kit**：提示对应的 `spec.md → plan.md → tasks.md` 起步命令。
- （每个下游工具的真实起步命令/skill 名同样**实现时核实**。）

交棒完成后，把产物位置回填进本条目的 `产物链接` 字段、状态标 `Planned`；条目本体不搬空、不离开池（保留决策上下文，符合「记忆层不删」）。

### 路由 B · `backlog-to-implementation`（backlog → 代码）

从 backlog 池挑一条推向实现。因为起点是 backlog 条目、而池里条目可能「已有 spec / 还没 spec」，先做一步 **spec 状态检测分流**，再进交棒：

**第 0 步 · 检测 spec 状态（智能分流）**：读本条目的 `产物链接` 字段——
- **已链接 spec**（之前走过 `backlog-to-spec`）→ 直接进第 1 步，交棒实现。
- **没有 spec** → 提示用户二选一，**不擅自跳过设计**：
  - ① 先走 `backlog-to-spec` 补规格，再回到本路由；
  - ② 对足够小、不需正式 spec 的改动，把 **backlog 条目本身**（问题 / 验收）当轻量输入，跳过 spec 直接实现。

**第 1 步 · 探测**已安装的**代码执行器 / 实现 agent**（候选，真实命令**实现时核实**）：

| 执行器 | 候选探测信号（待核实） | 说明 |
|---|---|---|
| **延续上一段选的工具**（默认优先） | `backlog-to-spec` 回填的 `产物链接` | 多数下游 spec 工具 spec→实现连续，优先一条龙 |
| Superpowers | `executing-plans` skill | 每 task 派 agent + 两段 review |
| Spec-Kit | `implement` 命令 / `.specify/` | — |
| Task Master | `task-master` CLI / `.taskmaster/` | `start` 拉起执行 |
| Matt Pocock skills | wayfinder + `to-tickets` 工单 | 派 agent 认领工单 |
| **当前 agent 兜底**（Claude Code / Codex / Cursor） | 当前运行环境即具备 | 无专用执行器时，当前 agent 直接按 spec/条目实现 |

**第 2 步 · 分支**：多个 → 让用户选；1 个 → 直接用；0 个专用执行器 → **默认兜底 = 当前 agent 直接实现**，或推荐延续上一段的工具。

**第 3 步 · 交棒 + 给起步步骤**：把 **spec + tasks + 依赖顺序 + 验收**（或第 0 步②的轻量输入）打包成执行器期望的输入，给出「代码从哪条命令 / 哪个 skill 开始」的具体起步指令。回填 `产物链接`、状态保持 `Planned`。

### 引擎复用 + 红线

- 两个 skill 共用一个「交棒路由」核心：`探测(探测清单) → 分支 → 打包(上下文打包器) → 起步指令`。探测清单与打包器是**参数**，骨架不重复（`backlog-to-implementation` 额外多一个前置的 spec 状态分流步）。
- **红线（本项目的护城河）**：无论哪一条路由，本项目只做「**路由 + 上下文打包 + 起步指令**」，**绝不自己调度 agent、不追踪实现进度、不接管执行**。讲话讲到「代码从哪开始」为止。越过这条，项目就滑成 task runner、失去差异化。
- **记忆层不追执行进度**：交棒后条目停在 `Planned`（附 `产物链接`），直到用户确认真正落地才手动标 `Done`。实现跑到哪一步是下游 agent 的事，记忆层不镜像它。

---

## 6. 与现有工具的边界（不做什么）

- **不做执行调度**：不排任务、不跑依赖图、不领任务执行——到该生产时交棒给 Spec-Kit / Task Master / mattpocock / Superpowers。
- **不做 issue tracker 替代**：不替代 GitHub Issues / Linear 的团队协作。定位是 **solo / 小团队的决策记忆**。
- **不做 PM 方法论平台**：Scrum/RICE/WSJF 只作为可选评估维度，不强加仪式。

---

## 7. 发布形态（到 push 时再定，先记着）

- 当前 `github-solo-skills/` 直接在外层 **私有** monorepo `awesome-skills` 里、会被它跟踪；而本项目要**开源**。
- 待决：变成一个像 `github-cookaihq/` 那样的**内层独立公开仓**，还是别的发布面。
- 提交身份：本仓约定 `cookaihq`（见 `awesome-skills/CLAUDE.md`），提交前用**仓库级** git config 设定（全局是 simplty，勿用）。

---

## 8. v1 最小可用范围（建议）

先把**最独特、最核心的「想法孵化」闭环**跑通（ideas 池），backlog 池的整理与交棒放 v1.1：

1. 约定文档 `CONVENTIONS.md`（目录 + 字段 + 状态机，各 skill 引用）。
2. **ideas 池闭环**：`capture-idea`（入）+ `review-ideas`（顾）+ `idea-to-backlog`（出）——本项目差异化最强的部分。
3. `reindex` 脚本（生成 `IDEAS.md` / `BACKLOG.md`）。
4. **v1.1（2026-07-14 已实现）**：`groom-backlog` + **两条交棒路由**（`backlog-to-spec` + `backlog-to-implementation`，共用 `HANDOFF.md` 交棒引擎，探测信号已核实）。

---

## 9. 开放问题（待拍板）

- ~~**项目命名**~~ **已定 = Seedbed 🌱（苗床）**（2026-07-14）。skill 命名走「**功能名 + Seedbed 花名叙事**」混合：`name` 用功能直白名（capture-idea…）保证 agent / 用户秒懂；园艺花名（sow / tend / transplant / harvest）只在 README / 文案发力，不进 `name`。
- ~~**数据根目录**~~ **已定（2026-07-14）= `.seedbed/`**（品牌一致、避免与其它工具 `.backlog` 撞名、指针配置与池同住）；多项目工作区与代管模式的解析机制见 §2.1。
- **是否 v1 就带一个 MCP/CLI**，还是坚持纯 skill 起步（本稿倾向后者）。
- **交棒前留快照？**：交棒给下游前，是否要先在记忆层留一份「交棒时的条目快照」，方便日后对比"当初想的" vs "下游实际做的"。
