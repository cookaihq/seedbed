# Seedbed 约定（CONVENTIONS）

> 这是所有 Seedbed skill 引用的**单一真相**：目录布局、字段模板、状态机、索引规则、硬规则。各 skill 不重复定义，只引用本文。设计依据见同目录 `DESIGN.md`。

## 1. 目录布局

Seedbed 的数据落在**目标项目根**的 `.seedbed/`：

```
.seedbed/
├── IDEAS.md          # ideas 索引，自动生成（勿手改）——索引在根，与条目不同级
├── BACKLOG.md        # backlog 索引，自动生成（勿手改）
├── ideas/            # 想法池：只放条目文件 YYYY-MM-DD-<slug>.md
├── backlog/          # 决策记忆池：只放条目文件（不删）
├── images/           # 配图（可选）
└── config.yml        # 可选；target: = 代管指针（§1.2）；root: = 项目内自定义数据目录（§1.3）
```

**`.seedbed/` 的双重身份**：它既是**发现锚点**（解析算法永远向上找它），也是**默认数据居所**。配置 `root:` 后两者分离——池与索引搬去 `<项目根>/<root>/`，`.seedbed/` 只剩 config（见 §1.3）。

**索引与条目分级**：`IDEAS.md` / `BACKLOG.md` 放数据根（默认 `.seedbed/`，配 `root:` 后为该目录），池目录（`ideas/`、`backlog/`）里**只有条目文件**——索引是派生物，不与数据混居（与 agent-shell `docs/backlogs/` 的索引/`entries/` 分级同构）。

**一条一文件**：每条记录只新建自己的文件、永不触碰共享文件——从根上消除多 agent 并发写冲突。索引 `IDEAS.md` / `BACKLOG.md` 是**派生物**，由 `scripts/reindex.mjs` 整体重算覆盖写，**不手改**。

### 1.1 数据根解析（每个 skill 动手前的第 0 步）

任何 Seedbed skill 动手前，先解析出**数据根**（池写到哪）——它同时就是**上下文根**（查重、追根因、读代码都去数据根所在的项目做）：

1. 从 cwd **向上**逐级查找 `.seedbed/`。
2. 命中且其 `config.yml` 含 `target: <路径>` → **代管指针**：跟随到目标项目的 `.seedbed/`。**target 只许一跳**——目标处再遇 target 即报错（防环）。
3. 读（最终那个 `.seedbed/` 的）`config.yml` 的 `root: <路径>` → 数据根 = `<项目根>/<root>`（项目内自定义数据目录，见 §1.3）；无 `root` → `.seedbed/` 本身就是数据根。
4. 未命中（典型：cwd 是**多项目工作区**，项目在子目录里）→ 扫 cwd 的直接子目录找 `.seedbed/`，结合对话上下文推断这条记录属于哪个项目，**向用户确认**（多候选让选；推断有把握也报一句再动手）。全无 → 问用户初始化到哪，**不擅自在工作区根新建**。

**指针失效**（target 路径不存在、或其下无 `.seedbed/`）→ 报错并问用户，**绝不**在死地址旁自动建池。

> 先例：git worktree 的 `.git` 文件（`gitdir: <路径>` 指针替代数据）；同构机制在 agent-shell 的可配置数据根（redirect 指针）中已验证。

### 1.2 代管模式（一个项目管另一个项目的 backlog）

用户可能专门建一个工作台项目（如 AgentShell 的项目目录）来打理**另一个**项目的 backlog。约定为**单向指针**：

- **代管项目**：`.seedbed/config.yml` 只放一行 `target: /path/to/目标项目`（绝对或相对路径），**本地不放池**。
- **目标项目**：普通的纯数据 `.seedbed/`，**不放任何回链**——回链会把本机路径提交进目标项目的 git（对协作者是噪音、暴露本地目录结构），且无人维护、易过期。信息只需单向流动。
- 目标项目自己照常跑 Seedbed（对它而言就是 §1.1 第 3 条的普通情形）；代管端与目标端写的是**同一个池**，一条一文件天然消化双端并发写。
- 在代管项目里跑 skill 时，**上下文根 = 目标项目**：查重 `rg` 目标项目的 `.seedbed/`，追根因读目标项目的代码。
- `target` 用绝对路径时注意跨机失效；代管项目通常是本机私有的，可接受。

### 1.3 项目内自定义数据目录（root 指针）

项目可能已有文档区约定（如 agent-shell 的 backlog 长期放 `docs/` 下），不想把池放 `.seedbed/`。此时在 `.seedbed/config.yml` 写：

```yaml
root: docs/backlogs    # 相对项目根；也可绝对路径（入库不推荐——本机路径会污染协作者）
```

- **`.seedbed/` 仍是发现锚点**：解析算法不变（向上找 `.seedbed/`），`root:` 只挪**数据居所**——池（`ideas/`、`backlog/`、`images/`）与索引（`IDEAS.md`、`BACKLOG.md`）全部住到 `<项目根>/<root>/`，结构不变、只换位置。
- **与 `target:` 互斥**：代管侧 config 只写 `target`（本地无池，root 无意义）；目标项目**自己的** config 决定自己的 `root`——代管一跳之后照常生效。
- 先例：git worktree 的 `.git` 文件（锚点在原地、数据在别处）；agent-shell 的可配置数据根（redirect 指针）。

- `YYYY-MM-DD-<slug>.md`，slug 为英文 kebab，简述这条。
- 同日多条靠 slug 区分；写前先扫同目录查重名，撞名加 `-2`。
- 配图 `images/YYYY-MM-DD-<主题>.png`，条目内用上一级相对路径 `![](../images/…)` 引用；不内联 base64、不引用本机绝对路径。

## 3. ideas 条目字段（轻模板 · 5 字段）

刻意省略追根因——捕获阶段零摩擦。

```markdown
# YYYY-MM-DD · 一句话标题

- 类型：Spark(⚡速记) | Bet(🎯押注) | Reference(🔖借鉴,必附来源) | Observation(🔍洞察)
- 想法：一句话讲清它是什么
- 触发场景：当时为什么冒出来 / 从哪看到的（借鉴类必附来源链接，如那篇文章 / 那条视频）
- 隐约的价值：一句话直觉，不要求验证
- 状态：Inbox | Brewing | Promoted | Dropped
```

### ideas 状态机

| 状态 | 含义 | 由谁流转 |
|------|------|----------|
| `Inbox` | 刚捕获、还没回顾 | capture-idea 写入的默认态 |
| `Brewing` | 回顾过、暂不成熟、继续养 | review-ideas 分流 |
| `Promoted` | 已升级为 backlog 条目（留档不删，链 backlog） | idea-to-backlog |
| `Dropped` | 放弃（**写原因，不删**） | review-ideas 分流 |

## 4. backlog 条目字段（完整模板 · 决策池门槛）

```markdown
# YYYY-MM-DD · 简短标题

- 状态：Backlog | Needs research | Ready for spec | Planned | Done | Dropped
- 类型：Bug | UX | Feature | Tech debt | Research
- 范围：影响的模块 / 流程 / 文件（未知写「待核实」）
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
- 产物链接：交棒后回填——spec 在哪 / tasks 在哪 / 用了哪个下游工具
- 升级条件 / 依赖：触发交棒的条件；Blocked by: <其它条目 或 None>
```

### backlog 状态机

| 状态 | 含义 |
|------|------|
| `Backlog` | 已记录、暂不处理 |
| `Needs research` | 关键事实不足，需先调研 |
| `Ready for spec` | 问题边界清楚，可交棒 backlog-to-spec |
| `Planned` | 已交棒下游（附产物链接） |
| `Done` | 已落地并验收（用户确认后手动标） |
| `Dropped` | 明确不做（**写原因，不删**） |

## 5. 索引规则（reindex.mjs 产出）

- **位置**：`.seedbed/IDEAS.md` 与 `.seedbed/BACKLOG.md`（根级，不进池目录）；链接用 `ideas/<file>` / `backlog/<file>` 相对路径。脚本会自动清理旧版遗留在池目录内的索引（迁移自愈）。
- **日期倒序**（新日期在前）；同日按文件创建时间倒序。
- **突出未决态**：`IDEAS.md` 把 Inbox/Brewing 排在前、Promoted/Dropped 折叠到末尾；`BACKLOG.md` 把未决态（Backlog/Needs research/Ready for spec/Planned）排在前、Done/Dropped 折叠到末尾。
- **行首 emoji**：ideas 用类型（⚡🎯🔖🔍）；backlog 用优先级（🔴高 / 🟡中 / 🟢低 / ⚪空）。
- 只产出导航链接，不嵌图、不拼全文。
- **幂等自愈**：从当前目录整体重算；漏跑只是索引暂缺一行，下次任何写入重跑即补。

## 6. 硬规则（全局，不可破）

1. **记忆层不删**：ideas / backlog 条目永不物理删除。放弃走 `Dropped` + 写原因。唯一例外：grooming 时确认重复、且已并入主条目的冗余副本。
2. **数字 / 来源不编造**：任何计算数值必须可验证；借鉴（Reference）类必附来源链接。宁可留「待核实」，不填臆测。
3. **一条一文件**：新记录只新建自己的文件，不改共享文件（索引由脚本生成）。
4. **先写问题、不先写方案**：backlog 的「问题」字段写现象与影响，方案放「数据链路待核实」或交棒后由下游产出。
5. **只路由不执行**：backlog-to-spec / -implementation 只做路由 + 打包 + 起步指令，绝不自己调度 agent 或接管执行（见 DESIGN §5.5 红线）。
