import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, rmSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const repo = fileURLToPath(new URL('../', import.meta.url))
const script = join(repo, 'scripts/reindex.mjs')

test('shared and installed entrypoints honor Skill isolation and root precedence', () => {
  const project = mkdtempSync(join(tmpdir(), 'seedbed-env-test-'))
  const cwd = join(project, 'project')
  mkdirSync(cwd)
  const env = {...process.env}
  delete env.SEEDBED_ROOT
  const roots = Object.fromEntries(['process', 'skill', 'shared', 'other', 'explicit'].map(name => {
    const root = join(project, name)
    mkdirSync(join(root, 'ideas'), {recursive: true})
    return [name, root]
  }))
  const write = (name, value) => writeFileSync(join(cwd, name), `SEEDBED_ROOT=${value}\n`)
  const run = (entry, args = [], extra = {}) => {
    const result = spawnSync(process.execPath, [entry, ...args], {cwd, env: {...env, ...extra}, encoding: 'utf8'})
    assert.equal(result.status, 0, result.stderr)
  }
  const selected = name => {
    assert.ok(existsSync(join(roots[name], 'IDEAS.md')), `${name} was not selected`)
    for (const root of Object.values(roots)) rmSync(join(root, 'IDEAS.md'), {force: true})
  }
  try {
    write('.env.local', roots.shared)
    write('.env.review-ideas', roots.other)
    writeFileSync(join(project, '.env.capture-idea'), 'SEEDBED_ROOT=wrong-parent\n')
    run(script, ['--skill', 'capture-idea'])
    selected('shared')
    write('.env.capture-idea', roots.skill)
    // An unusable lower layer cannot block an explicit root or a higher match.
    mkdirSync(join(cwd, '.env'))
    run(script, ['--skill', 'capture-idea'])
    selected('skill')
    run(script, ['--skill', 'capture-idea'], {SEEDBED_ROOT: roots.process})
    selected('process')
    run(script, ['--skill', 'capture-idea', roots.explicit], {SEEDBED_ROOT: roots.process})
    selected('explicit')
    write('.env.capture-idea', '')
    run(script, ['--skill', 'capture-idea'])
    selected('shared')
    const install = join(project, 'installed')
    mkdirSync(install)
    run(join(repo, 'scripts/install.mjs'), [install])
    write('.env.capture-idea', roots.skill)
    run(resolve(install, '.claude/skills/capture-idea/scripts/reindex.mjs'))
    selected('skill')
    run(resolve(install, '.codex/skills/review-ideas/scripts/reindex.mjs'))
    selected('other')
  } finally {
    rmSync(project, {recursive: true, force: true})
  }
})
