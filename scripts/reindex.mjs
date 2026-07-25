#!/usr/bin/env node
// Seedbed 索引生成器：扫 <root>/ideas 和 <root>/backlog 下的 *.md，
// 重算覆盖写 IDEAS.md / BACKLOG.md。约定见 ../CONVENTIONS.md §5。
//
// 用法：
//   node reindex.mjs                # 数据根 = ./.seedbed（相对 cwd）
//   node reindex.mjs <root>         # 显式指定数据根
//   SEEDBED_ROOT=/path node reindex.mjs
//
// 排序：日期倒序；同日按文件创建时间(birthtime)倒序。
// 突出未决态：未决在前，已决(Promoted/Dropped, Done/Dropped)折叠到末尾。
// 行首 emoji：ideas=类型(⚡🎯🔖🔍)；backlog=优先级(🔴🟡🟢⚪)。
// 幂等：从当前目录整体重算；只产出导航链接，不嵌图不拼全文。

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync, unlinkSync } from 'node:fs'
import { join, resolve, basename, dirname } from 'node:path'

// ── 数据根解析（CONVENTIONS §1.1–§1.3）─────────────────────────────────────
// 接受三种输入：项目根 / .seedbed 目录 / 直接的数据根目录。
// 跟随 config.yml 两级指针：target:（代管，跨项目一跳）→ root:（项目内自定义数据目录）。
function readConf(seedbedDir, key) {
  try {
    const t = readFileSync(join(seedbedDir, 'config.yml'), 'utf8')
    const m = t.match(new RegExp(`^\\s*${key}\\s*:\\s*(.+)$`, 'm'))
    return m ? m[1].trim().replace(/^['"]|['"]$/g, '') : null
  } catch { return null }
}
function resolveDataRoot(input) {
  let p = resolve(input)
  if (basename(p) !== '.seedbed' && existsSync(join(p, '.seedbed'))) p = join(p, '.seedbed')
  if (basename(p) !== '.seedbed') return p // 直接给的数据根，原样使用
  const target = readConf(p, 'target')
  if (target) {
    p = join(resolve(dirname(p), target), '.seedbed') // 相对路径基 = 项目根（.seedbed 上级）
    if (readConf(p, 'target')) { console.error('✗ target 指针只允许一跳（不许链）'); process.exit(1) }
  }
  const root = readConf(p, 'root')
  return root ? resolve(dirname(p), root) : p // root 相对项目根；无 root 则 .seedbed/ 即数据根
}

const ROOT = resolveDataRoot(process.argv[2] || process.env.SEEDBED_ROOT || '.seedbed')

const DATE_RE = /(\d{4}-\d{2}-\d{2})/
// 取「字段：」后到首个分隔符（｜|（(）前的主词，丢弃括注。
const field = (name) => new RegExp(`^-\\s*${name}[^：:]*[：:]\\s*([^（(|｜\\s]*)`)
const TYPE_RE = field('类型')
const STATUS_RE = field('状态')
const PRIORITY_RE = field('实现优先级')

const TYPE_EMOJI = { spark: '⚡', bet: '🎯', reference: '🔖', observation: '🔍', 速记: '⚡', 押注: '🎯', 借鉴: '🔖', 洞察: '🔍' }
const PRIORITY_EMOJI = (v) => {
  const s = (v || '').trim().toLowerCase()
  if (s === 'high' || s === '高') return '🔴'
  if (s === 'medium' || s === 'med' || s === '中') return '🟡'
  if (s === 'low' || s === '低') return '🟢'
  return '⚪'
}

// 未决态集合（排前面）。其余（Promoted/Dropped/Done…）折叠到末尾。
const IDEAS_OPEN = new Set(['inbox', 'brewing'])
const BACKLOG_OPEN = new Set(['backlog', 'needs', 'ready', 'planned'])

function parseEntry(dir, file) {
  const text = readFileSync(join(dir, file), 'utf8')
  const lines = text.split('\n')
  const header = lines.find((l) => /^#{1,2} /.test(l)) // 规范为 `# `(H1)，兼容旧 `## `
  const date = header ? (header.match(DATE_RE) || [])[1] : null
  const title = header && header.includes('·') ? header.slice(header.indexOf('·') + 1).trim() : file.replace(/\.md$/, '')
  const pick = (re) => { const l = lines.find((x) => re.test(x)); return l ? (l.match(re)[1] || '').trim() : '' }
  return {
    file, date, title,
    type: pick(TYPE_RE),
    status: pick(STATUS_RE),
    priority: pick(PRIORITY_RE),
    birthtime: statSync(join(dir, file)).birthtimeMs,
  }
}

function build(poolDir, { indexName, title, leadEmoji, openSet, subdir }) {
  const dir = join(ROOT, subdir)
  if (!existsSync(dir)) return
  // 迁移自愈：索引曾与条目同级（池目录内），现统一放 .seedbed/ 根——清掉旧位置遗留
  try { unlinkSync(join(dir, indexName)) } catch { /* 无遗留 */ }
  const files = readdirSync(dir).filter((f) => f.endsWith('.md'))
  const items = files.map((f) => parseEntry(dir, f))

  const isOpen = (it) => openSet.has((it.status || '').toLowerCase().slice(0, openSet === BACKLOG_OPEN ? 4 : 99))
    || [...openSet].some((k) => (it.status || '').toLowerCase().startsWith(k))
  const cmp = (a, b) => (b.date || '').localeCompare(a.date || '') || b.birthtime - a.birthtime

  const open = items.filter(isOpen).sort(cmp)
  const done = items.filter((it) => !isOpen(it)).sort(cmp)

  const line = (it) => `- ${leadEmoji(it)} [${it.title}](${subdir}/${it.file})${it.status ? ` · ${it.status}` : ''}`
  const out = [
    `# ${title}`, '',
    `> 自动生成（勿手改）。共 ${items.length} 条：未决 ${open.length}、已决 ${done.length}。`, '',
    '## 未决', '', ...(open.length ? open.map(line) : ['_（无）_']), '',
    '## 已决（折叠）', '', ...(done.length ? done.map(line) : ['_（无）_']), '',
  ].join('\n')

  writeFileSync(join(ROOT, indexName), out) // 索引在 .seedbed/ 根，与条目不同级
  console.log(`✓ ${indexName}: ${items.length} 条`)
}

build(ROOT, {
  subdir: 'ideas', indexName: 'IDEAS.md', title: 'Ideas 🌱',
  openSet: IDEAS_OPEN,
  leadEmoji: (it) => TYPE_EMOJI[(it.type || '').toLowerCase()] || '💡',
})
build(ROOT, {
  subdir: 'backlog', indexName: 'BACKLOG.md', title: 'Backlog 🪴',
  openSet: BACKLOG_OPEN,
  leadEmoji: (it) => PRIORITY_EMOJI(it.priority),
})
