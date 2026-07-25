#!/usr/bin/env node
// Seedbed 安装器：先把 skills/ 下每个 skill 构建成**自包含**产物（dist/<name>/：
// 共享 CONVENTIONS/HANDOFF 进 references/、reindex.mjs 进 scripts/、相对链接改写），
// 再装进目标项目的 .claude/skills/ 与 .codex/skills/ ——Claude 与 Codex 双引擎原生可读。
//
// 用法：
//   node scripts/install.mjs <目标项目绝对路径>          # 复制模式（默认）：拷贝 dist 产物
//   node scripts/install.mjs <目标项目绝对路径> --link   # 软链模式：项目条目软链 → 本仓 dist/<name>
//
// 软链模式说明：多个项目共享同一份 dist 产物；seedbed 源改动后重跑本脚本（任意模式）
// 即重建 dist，所有软链项目同时生效，无需逐个重装。
//
// 安全守卫：
// - 复制模式：目标是软链 → 跳过不覆盖（可能是 AgentShell 注册表物化的技能）。
// - 软链模式：目标是指向本仓 dist 的软链 → 重指（幂等）；指向别处的软链 → 跳过；
//   真实目录 → 视为本安装器先前复制模式的产物，替换为软链（会打印提示）。

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SRC = path.dirname(path.dirname(fileURLToPath(import.meta.url))) // seedbed 根
const DIST = path.join(SRC, 'dist')
const args = process.argv.slice(2)
const linkMode = args.includes('--link')
const target = args.find((a) => !a.startsWith('--'))
if (!target || !fs.existsSync(target)) {
  console.error('用法: node scripts/install.mjs <目标项目绝对路径> [--link]')
  process.exit(1)
}

const SKILLS = fs.readdirSync(path.join(SRC, 'skills'), { withFileTypes: true })
  .filter((d) => d.isDirectory()).map((d) => d.name)
const NEEDS_HANDOFF = new Set(['backlog-to-spec', 'backlog-to-implementation'])
const ENGINE_DIRS = ['.claude/skills', '.codex/skills']

// ── 第 1 步：构建 dist/（每次全量重建，幂等）─────────────────────────────
fs.rmSync(DIST, { recursive: true, force: true })
for (const name of SKILLS) {
  const dest = path.join(DIST, name)
  fs.mkdirSync(path.join(dest, 'references'), { recursive: true })
  fs.mkdirSync(path.join(dest, 'scripts'), { recursive: true })
  const text = fs.readFileSync(path.join(SRC, 'skills', name, 'SKILL.md'), 'utf8')
    .replaceAll('../../CONVENTIONS.md', 'references/CONVENTIONS.md')
    .replaceAll('../../HANDOFF.md', 'references/HANDOFF.md')
    .replaceAll('<seedbed>/scripts/reindex.mjs', 'scripts/reindex.mjs')
  fs.writeFileSync(path.join(dest, 'SKILL.md'), text)
  fs.copyFileSync(path.join(SRC, 'CONVENTIONS.md'), path.join(dest, 'references', 'CONVENTIONS.md'))
  if (NEEDS_HANDOFF.has(name)) {
    fs.copyFileSync(path.join(SRC, 'HANDOFF.md'), path.join(dest, 'references', 'HANDOFF.md'))
  }
  fs.copyFileSync(path.join(SRC, 'scripts', 'reindex.mjs'), path.join(dest, 'scripts', 'reindex.mjs'))
}
console.log(`✓ dist 构建完成（${SKILLS.length} 个 skill）`)

// ── 第 2 步：装进目标项目 ────────────────────────────────────────────────
function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true })
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const f = path.join(from, e.name), t = path.join(to, e.name)
    e.isDirectory() ? copyDir(f, t) : fs.copyFileSync(f, t)
  }
}

let installed = 0, skipped = 0
for (const name of SKILLS) {
  const distDir = path.join(DIST, name)
  for (const engineDir of ENGINE_DIRS) {
    const dest = path.join(target, engineDir, name)
    let st = null
    try { st = fs.lstatSync(dest) } catch { /* 不存在 */ }

    if (linkMode) {
      if (st?.isSymbolicLink()) {
        const cur = fs.readlinkSync(dest)
        if (path.resolve(path.dirname(dest), cur) !== distDir && !cur.startsWith(DIST)) {
          console.warn(`↷ 跳过 ${engineDir}/${name}：软链指向别处（${cur}），不覆盖`)
          skipped++
          continue
        }
        fs.unlinkSync(dest) // 指向本仓 dist 的旧链，重指（幂等）
      } else if (st) {
        console.warn(`… ${engineDir}/${name}：原为真实目录（先前复制安装），替换为软链`)
        fs.rmSync(dest, { recursive: true, force: true })
      }
      fs.mkdirSync(path.dirname(dest), { recursive: true })
      fs.symlinkSync(distDir, dest)
      console.log(`✓ ${engineDir}/${name} -> dist/${name}（软链）`)
      installed++
    } else {
      if (st?.isSymbolicLink()) {
        console.warn(`↷ 跳过 ${engineDir}/${name}：目标是软链（可能由 AgentShell 注册表管理），不覆盖`)
        skipped++
        continue
      }
      fs.rmSync(dest, { recursive: true, force: true })
      copyDir(distDir, dest)
      console.log(`✓ ${engineDir}/${name}（复制）`)
      installed++
    }
  }
}
console.log(`\n完成：安装 ${installed} 处、跳过 ${skipped} 处（目标 ${target}，模式 ${linkMode ? '软链' : '复制'}）。`)
console.log(linkMode
  ? '软链模式：seedbed 源改动后重跑本脚本重建 dist，所有软链项目同时生效。'
  : '复制模式：手装为真实目录——AgentShell 只管理软链、不会清除；但不入插件注册表，「技能和插件」页不显示。')
