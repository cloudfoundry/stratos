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

import { readFileSync, existsSync } from 'node:fs'
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

// Tokens a component contributes to the DOM contract: its element selector
// and every test-hook value (static, or quoted fragment of a dynamic
// binding — fragments ending in '-' are prefixes and match as such).
function tokensFor(file) {
  const tokens = new Set()
  // A change to either half of a component involves the whole contract, so
  // read the sibling template/class too.
  const sibling = file.endsWith('.html') ? file.replace(/\.html$/, '.ts') : file.replace(/\.ts$/, '.html')
  const sources = [file, ...(existsSync(sibling) ? [sibling] : [])]
  for (const src of sources) {
    if (!existsSync(src)) continue // deleted in this diff
    const text = readFileSync(src, 'utf8')
    for (const m of text.matchAll(/\bselector:\s*['"]([a-z][a-z0-9-]+)['"]/g)) tokens.add(m[1])
    for (const [staticDef, dynamicDef] of Object.values(HOOK_DEFS)) {
      for (const m of text.matchAll(staticDef)) tokens.add(m[1])
      for (const m of text.matchAll(dynamicDef)) {
        for (const s of m[1].matchAll(/'([^']+)'/g)) tokens.add(s[1])
      }
    }
    for (const m of text.matchAll(DATA_TEST_CONFIG)) tokens.add(m[1])
  }
  return tokens
}

const changedComponents = changed.filter(
  (f) => f.startsWith('src/frontend/') && (f.endsWith('.html') || f.endsWith('.ts')) && !f.endsWith('.spec.ts'),
)

if (!changedComponents.length) {
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
for (const [f, text] of e2eText) {
  for (const m of text.matchAll(/import\s+(?:type\s+)?(?:{([^}]*)}|[\w*\s,]+)\s+from\s+['"](\.[^'"]+)['"]/g)) {
    const target = resolveModule(f, m[2])
    if (!target) continue
    const names = (m[1] ?? '').split(',').map((s) => s.trim().split(/\s+as\s+/)[0].trim()).filter(Boolean)
    const barrel = exportsOf(target)
    const edges = new Set()
    if (names.length && barrel.size) {
      for (const n of names) edges.add(barrel.get(n) ?? target)
    } else {
      edges.add(target)
    }
    for (const t of edges) {
      if (!importedBy.has(t)) importedBy.set(t, new Set())
      importedBy.get(t).add(f)
    }
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

// A token counts as referenced only when it touches a string-literal quote,
// where locator values live — generic hooks like 'row', 'card', 'empty'
// would otherwise match ordinary identifiers and prose all over the suite
// ('row' in BrowserContext, 'empty' in a comment) and fan the report out to
// every spec. Prefix tokens ('row-action-') open a quoted value and may be
// followed by more of it; whole tokens must be quote-delimited on one side
// and value-terminal on the other.
function referenced(text, token) {
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  if (token.endsWith('-')) return new RegExp(`["']${escaped}`).test(text)
  return new RegExp(`["']${escaped}(?![-\\w])|(?<![-\\w])${escaped}["']`).test(text)
}

const report = []
for (const comp of changedComponents) {
  const tokens = tokensFor(comp)
  if (!tokens.size) continue
  const specs = new Set()
  for (const [f, text] of e2eText) {
    if (![...tokens].some((t) => referenced(text, t))) continue
    for (const s of specsReaching(f)) specs.add(s)
  }
  if (specs.size) report.push({ comp, specs: [...specs].sort() })
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
