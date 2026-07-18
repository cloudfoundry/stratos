#!/usr/bin/env node
// Advisory component→e2e coverage map (#5619 section 3). Given changed file
// paths (argv, or stdin one-per-line), reports which e2e specs exercise the
// changed components, derived mechanically from the data-test contract: a
// changed component's test hooks and element selector are matched against
// e2e sources, and hits in shared helpers/page objects are walked up the
// e2e import graph to the specs that use them. Advisory only — always
// exits 0; the output tells a reviewer which specs are worth running.
//
// Usage: git diff --name-only develop...HEAD | node scripts/e2e-impact.mjs
// For components deleted in the diff, tokens are harvested from the base
// ref ($IMPACT_BASE, default 'develop') so their specs still surface.

import { readFileSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { files, HOOK_DEFS, DATA_TEST_CONFIG } from './lib/e2e-hooks.mjs'

process.chdir(fileURLToPath(new URL('..', import.meta.url)))

if (process.argv.length <= 2 && process.stdin.isTTY) {
  console.error('Usage: git diff --name-only develop...HEAD | node scripts/e2e-impact.mjs')
  console.error('   or: node scripts/e2e-impact.mjs <changed-file> [...]')
  process.exit(1)
}
const input = process.argv.length > 2
  ? process.argv.slice(2)
  : readFileSync(0, 'utf8').split('\n')
const changed = input.map((l) => l.trim()).filter(Boolean)

const IMPACT_BASE = process.env.IMPACT_BASE ?? 'develop'
function sourceText(file) {
  if (existsSync(file)) return readFileSync(file, 'utf8')
  // Deleted in this diff — a deletion is the change MOST likely to strand
  // specs, so harvest what the component used to define from the base ref.
  try {
    return execFileSync('git', ['show', `${IMPACT_BASE}:${file}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
  } catch {
    return null
  }
}

// Tokens a component contributes to the DOM contract, split by how they may
// legitimately appear in e2e sources:
// - selectors ('app-invite-users'): distinctive kebab tags that occur inside
//   larger CSS selector strings ('app-x form', 'app-x, app-y') — matched on
//   word boundaries alone.
// - hook values / prefixes: attribute values that always sit at the start of
//   a quoted region — matched quote-adjacent so generic names ('row',
//   'empty') don't light up every identifier and comment in the suite.
function tokensFor(stem) {
  const selectors = new Set()
  const hooks = new Set()
  for (const src of [stem + '.ts', stem + '.html']) {
    const text = sourceText(src)
    if (text === null) continue
    for (const m of text.matchAll(/\bselector:\s*['"]([a-z][a-z0-9-]+)['"]/g)) selectors.add(m[1])
    for (const [staticDef, dynamicDef] of Object.values(HOOK_DEFS)) {
      for (const m of text.matchAll(staticDef)) hooks.add(m[1])
      for (const m of text.matchAll(dynamicDef)) {
        for (const s of m[1].matchAll(/'([^']+)'/g)) hooks.add(s[1])
      }
    }
    for (const m of text.matchAll(DATA_TEST_CONFIG)) hooks.add(m[1])
  }
  return { selectors, hooks }
}

// One entry per component, whichever half (or both) changed.
const changedStems = [...new Set(
  changed
    .filter((f) => f.startsWith('src/frontend/') && (f.endsWith('.html') || f.endsWith('.ts')) && !f.endsWith('.spec.ts'))
    .map((f) => f.replace(/\.(html|ts)$/, '')),
)]

if (!changedStems.length) {
  console.log('e2e impact: no frontend component changes.')
  process.exit(0)
}

const e2eFiles = files('e2e', ['.ts'])
const e2eText = new Map(e2eFiles.map((f) => [f, readFileSync(f, 'utf8')]))

function resolveModule(fromFile, spec) {
  const target = path.join(path.dirname(fromFile), spec).replaceAll('\\', '/')
  for (const cand of [target + '.ts', target + '/index.ts', target]) {
    if (e2eText.has(cand)) return cand
  }
  return null
}

// Named re-exports of a barrel (index.ts), mapped to the declaring module.
// Importing a name through a barrel must create an edge to that module, not
// to the barrel — otherwise one hit in a shared component fans out through
// the barrel to every spec that imports anything from it.
const barrelExports = new Map()
function exportsOf(file) {
  if (!barrelExports.has(file)) {
    const map = new Map()
    for (const m of e2eText.get(file).matchAll(/export\s*(?:type\s*)?{([^}]*)}\s*from\s*['"](\.[^'"]+)['"]/g)) {
      const src = resolveModule(file, m[2])
      if (!src) continue
      for (const raw of m[1].split(',')) {
        const name = raw.trim().split(/\s+as\s+/).pop()?.trim()
        if (name) map.set(name, src)
      }
    }
    barrelExports.set(file, map)
  }
  return barrelExports.get(file)
}

// Reverse import graph: helper/page-object file -> e2e files importing it.
const importedBy = new Map()
const addEdge = (target, importer) => {
  if (!importedBy.has(target)) importedBy.set(target, new Set())
  importedBy.get(target).add(importer)
}
for (const [f, text] of e2eText) {
  // Re-export statements make the re-exporting file an importer of its
  // source, so export-star chains stay connected in the walk.
  for (const m of text.matchAll(/export\s+(?:type\s+)?(?:{[^}]*}|\*(?:\s+as\s+\w+)?)\s+from\s+['"](\.[^'"]+)['"]/g)) {
    const target = resolveModule(f, m[1])
    if (target) addEdge(target, f)
  }
  // import <clause> from '...' — named braces pierce barrels; a default or
  // namespace part may use anything the module re-exports, so it edges to
  // the module and every named re-export target.
  for (const m of text.matchAll(/import\s+(?:type\s+)?([\w*\s,{}]+?)\s+from\s+['"](\.[^'"]+)['"]/g)) {
    const target = resolveModule(f, m[2])
    if (!target) continue
    const clause = m[1]
    const braces = clause.match(/{([^}]*)}/)
    const barrel = exportsOf(target)
    if (braces) {
      for (const raw of braces[1].split(',')) {
        const name = raw.trim().split(/\s+as\s+/)[0].trim()
        if (name) addEdge(barrel.get(name) ?? target, f)
      }
    }
    if (clause.replace(/{[^}]*}/, '').trim()) {
      addEdge(target, f)
      for (const src of new Set(barrel.values())) addEdge(src, f)
    }
  }
  // Side-effect imports: import './x'
  for (const m of text.matchAll(/import\s*['"](\.[^'"]+)['"]/g)) {
    const target = resolveModule(f, m[1])
    if (target) addEdge(target, f)
  }
}

const isSpec = (f) => f.endsWith('.spec.ts')

// Walk hits up to the specs that (transitively) import them.
function specsReaching(file, seen = new Set()) {
  if (seen.has(file)) return []
  seen.add(file)
  if (isSpec(file)) return [file]
  return [...(importedBy.get(file) ?? [])].flatMap((f) => specsReaching(f, seen))
}

const esc = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
// Hook values sit at the edge of a quoted region (attr values in locator
// strings, incl. template literals); prefixes open one and may be followed
// by more value.
function hookReferenced(text, token) {
  const e = esc(token)
  if (token.endsWith('-')) return new RegExp(`["'\`]${e}`).test(text)
  return new RegExp(`["'\`]${e}(?![-\\w])|(?<![-\\w])${e}["'\`]`).test(text)
}
// Selector tags may sit mid-string in compound selectors ('app-x form',
// 'app-x, app-y') — word boundaries suffice, the tags are distinctive.
function selectorReferenced(text, token) {
  return new RegExp(`(?<![-\\w])${esc(token)}(?![-\\w])`).test(text)
}

const report = []
for (const stem of changedStems) {
  const { selectors, hooks } = tokensFor(stem)
  if (!selectors.size && !hooks.size) continue
  const specs = new Set()
  for (const [f, text] of e2eText) {
    const hit = [...selectors].some((t) => selectorReferenced(text, t))
      || [...hooks].some((t) => hookReferenced(text, t))
    if (!hit) continue
    for (const s of specsReaching(f)) specs.add(s)
  }
  if (specs.size) report.push({ comp: stem, specs: [...specs].sort() })
}

if (!report.length) {
  console.log('e2e impact: changed components have no e2e references — no scoped specs to suggest.')
} else {
  console.log('e2e impact — specs covering changed components (advisory):')
  for (const { comp, specs } of report) {
    console.log(`\n${comp}`)
    for (const s of specs) console.log(`  ${s}`)
  }
  const all = [...new Set(report.flatMap((r) => r.specs))].sort()
  console.log(`\nRun scoped: npx playwright test --project=setup --project=chromium ${all.join(' ')}`)
}
