#!/usr/bin/env node
// Tiered e2e runner behind `make test e2e TIER=... GROUP=...` — see
// TESTING.md "Tiered E2E runs". Selections are additive: tier-computed
// spec sets (diff-driven, via e2e-impact.mjs) and group directories union
// into one file list; browsers apply uniformly to the result. Tiers that
// scope down (acceptance, broad) add a second pass running @smoke tests
// over the UNSELECTED remainder, so every run keeps cross-surface cover.
// Any selection touching e2e/tests/dependent/ (see TESTING.md "Dependent
// tests") runs that group in its own trailing pass, after everything else.
// Exits nonzero if any Playwright invocation fails.

import { execFileSync, spawnSync } from 'node:child_process'
import { readFileSync, readdirSync, rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

process.chdir(fileURLToPath(new URL('..', import.meta.url)))

const opt = { tier: [], group: [], browsers: [], pr: null, base: process.env.IMPACT_BASE ?? 'develop', dryRun: false }
const args = process.argv.slice(2)
for (let i = 0; i < args.length; i++) {
  const next = () => {
    if (i + 1 >= args.length) { console.error(`${args[i]} needs a value`); process.exit(2) }
    return args[++i]
  }
  switch (args[i]) {
    case '--tier': opt.tier.push(...next().split(',').filter(Boolean)); break
    case '--group': opt.group.push(...next().split(',').filter(Boolean)); break
    case '--browsers': opt.browsers.push(...next().split(',').filter(Boolean)); break
    case '--base': opt.base = next(); break
    case '--dry-run': opt.dryRun = true; break
    case '--pr': opt.pr = next(); break
    default: console.error(`unknown argument: ${args[i]}`); process.exit(2)
  }
}

const TESTS_DIR = 'e2e/tests'
const TIERS = ['acceptance', 'broad', 'full']
const GROUPS = readdirSync(TESTS_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory()).map((d) => d.name).sort()
for (const t of opt.tier) if (!TIERS.includes(t)) { console.error(`unknown tier '${t}' (tiers: ${TIERS.join(', ')})`); process.exit(2) }
for (const g of opt.group) if (!GROUPS.includes(g)) { console.error(`unknown group '${g}' (groups: ${GROUPS.join(', ')})`); process.exit(2) }
if (!opt.tier.length && !opt.group.length) { console.error('nothing selected: pass --tier and/or --group'); process.exit(2) }

function specsUnder(dir) {
  return readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((e) => e.isFile() && e.name.endsWith('.spec.ts'))
    .map((e) => path.join(e.parentPath, e.name)).sort()
}
const allSpecs = specsUnder(TESTS_DIR)
const groupOf = (spec) => spec.split(path.sep)[2] // e2e/tests/<group>/...

function impactedSpecs() {
  const diff = execFileSync('git', ['diff', '--name-only', `${opt.base}...HEAD`], { encoding: 'utf8' })
  const r = spawnSync('node', ['scripts/e2e-impact.mjs', '--files'], { input: diff, encoding: 'utf8' })
  if (r.status !== 0) { console.error('e2e-impact.mjs failed:\n' + r.stderr); process.exit(2) }
  return r.stdout.split('\n').map((l) => l.trim()).filter(Boolean)
}

// Selection: union everything into one file-level set.
const files = new Set()
let smokeRest = false
let impactEmpty = false
for (const t of opt.tier) {
  if (t === 'full') { for (const s of allSpecs) files.add(s) }
  else {
    const impacted = impactedSpecs()
    if (!impacted.length) impactEmpty = true
    if (t === 'acceptance') for (const s of impacted) files.add(s)
    else for (const s of impacted) for (const f of specsUnder(path.join(TESTS_DIR, groupOf(s)))) files.add(f)
    smokeRest = true
  }
}
for (const g of opt.group) for (const f of specsUnder(path.join(TESTS_DIR, g))) files.add(f)

const smokeFiles = allSpecs.filter((f) => readFileSync(f, 'utf8').includes("tag: '@smoke'"))
// Playwright runs the `setup` dependency automatically for each selected
// browser project; never pass --project=setup explicitly.
const browserFlags = (!opt.browsers.length || opt.browsers.includes('all'))
  ? [] : opt.browsers.map((b) => `--project=${b}`)

// dependent/ holds specs that mutate shared state other specs rely on
// (endpoint registry today — see TESTING.md). A failed restore there
// cascades into every spec that assumes a registered endpoint, so the
// group always runs last, in its own pass, regardless of how it was
// selected (tier, group, impact, or explicit files).
const DEPENDENT_GROUP = 'dependent'
const isDependent = (f) => groupOf(f) === DEPENDENT_GROUP
// Split a file list into [primary, dependent] passes; either half may be
// empty, in which case its caller skips pushing that run.
function splitDependent(fileList) {
  return [fileList.filter((f) => !isDependent(f)), fileList.filter(isDependent)]
}

const runs = []
if (files.size) {
  const [primary, dependent] = splitDependent([...files].sort())
  if (primary.length) runs.push({ label: `selected specs (${primary.length} files)`, args: [...browserFlags, ...primary] })
  if (dependent.length) runs.push({ label: `selected specs — dependent (${dependent.length} files)`, args: [...browserFlags, ...dependent], dependent: true })
}
if (smokeRest) {
  const rest = smokeFiles.filter((f) => !files.has(f))
  const [primary, dependent] = splitDependent(rest)
  if (primary.length) runs.push({ label: `smoke over the rest (${primary.length} files)`, args: [...browserFlags, '--grep', '@smoke', ...primary] })
  if (dependent.length) runs.push({ label: `smoke over the rest — dependent (${dependent.length} files)`, args: [...browserFlags, '--grep', '@smoke', ...dependent], dependent: true })
}
// Stable sort: dependent-group passes always trail, but their relative
// order (and every non-dependent pass's order) is otherwise unchanged.
runs.sort((a, b) => (a.dependent ? 1 : 0) - (b.dependent ? 1 : 0))
if (impactEmpty) console.log(`impact scan against '${opt.base}' found no covered specs — running smoke only.`)
if (!runs.length) { console.log('selection is empty — nothing to run.'); process.exit(0) }

const t0 = Date.now()
let failedTests = []
let totals = { expected: 0, unexpected: 0, flaky: 0, skipped: 0 }
let exitCode = 0
for (const run of runs) {
  const argv = ['playwright', 'test', ...run.args]
  console.log(`\n>>> ${run.label}\n    npx ${argv.join(' ')}`)
  if (opt.dryRun) continue
  rmSync('e2e-reports/results.json', { force: true }) // a crashed run must not inherit the previous run's report
  const r = spawnSync('npx', argv, { stdio: 'inherit' })
  if (r.status !== 0) exitCode = 1
  try {
    const j = JSON.parse(readFileSync('e2e-reports/results.json', 'utf8'))
    for (const k of Object.keys(totals)) totals[k] += j.stats?.[k] ?? 0
    const walk = (suite, crumbs) => {
      for (const sub of suite.suites ?? []) walk(sub, [...crumbs, sub.title])
      for (const spec of suite.specs ?? []) if (!spec.ok) failedTests.push([...crumbs, spec.title].join(' › '))
    }
    for (const s of j.suites ?? []) walk(s, [s.title])
  } catch {
    console.error('could not read e2e-reports/results.json for this invocation')
    exitCode = 1
  }
}

if (opt.dryRun) { console.log('\n(dry run — nothing executed)'); process.exit(0) }

const sha = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim()
const branch = execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { encoding: 'utf8' }).trim()
const dirty = execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim()
  ? ' — **DIRTY TREE**, results include uncommitted changes' : ''
const mins = Math.floor((Date.now() - t0) / 60000)
const secs = Math.round(((Date.now() - t0) % 60000) / 1000)
const verdict = [
  `## e2e verdict — ${exitCode === 0 ? 'PASS' : 'FAIL'}`,
  `- selection: ${opt.tier.length ? `TIER=${opt.tier.join(',')}` : ''} ${opt.group.length ? `GROUP=${opt.group.join(',')}` : ''}`.trimEnd(),
  `- browsers: ${opt.browsers.length ? opt.browsers.join(', ') : 'all'}`,
  `- commit: ${sha} (${branch})${dirty}`,
  `- runs: ${runs.map((r) => r.label).join('; ')}`,
  `- results: ${totals.expected} passed, ${totals.unexpected} failed, ${totals.flaky} flaky, ${totals.skipped} skipped`,
  `- wall-clock: ${mins}m ${secs}s`,
  ...(failedTests.length ? ['', '### Failed', ...failedTests.map((t) => `- ${t}`)] : []),
].join('\n')
console.log('\n' + verdict + '\n')

if (opt.pr) {
  const r = spawnSync('gh', ['pr', 'comment', opt.pr, '--repo', 'cloudfoundry/stratos', '--body-file', '-'],
    { input: verdict, encoding: 'utf8' })
  if (r.status === 0) console.log(`verdict posted to PR #${opt.pr}`)
  else console.error(`could not post verdict to PR #${opt.pr} (gh exit ${r.status}) — run result above still stands`)
}

process.exit(exitCode)
