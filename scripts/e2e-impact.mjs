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

import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

process.chdir(fileURLToPath(new URL('..', import.meta.url)))

const input = process.argv.length > 2
  ? process.argv.slice(2)
  : readFileSync(0, 'utf8').split('\n')
const changed = input.map((l) => l.trim()).filter(Boolean)

function files(dir, ext) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === 'node_modules') return []
    const p = `${dir}/${entry.name}`
    if (entry.isDirectory()) return files(p, ext)
    return ext.some((e) => entry.name.endsWith(e)) ? [p] : []
  })
}

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
    for (const m of text.matchAll(/data-test(?:id)?=["']([^"']+)["']/g)) tokens.add(m[1])
    for (const m of text.matchAll(/\[attr\.data-test(?:id)?\]="([^"]*)"/g)) {
      for (const s of m[1].matchAll(/'([^']+)'/g)) tokens.add(s[1])
    }
    for (const m of text.matchAll(/\bdataTest:\s*['"]([^'"]+)['"]/g)) tokens.add(m[1])
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

// Reverse import graph: helper/page-object file -> e2e files importing it.
const importedBy = new Map()
for (const [f, text] of e2eText) {
  for (const m of text.matchAll(/from\s+['"](\.[^'"]+)['"]/g)) {
    let target = path.join(path.dirname(f), m[1]).replaceAll('\\', '/')
    for (const cand of [target + '.ts', target + '/index.ts', target]) {
      if (e2eText.has(cand)) {
        if (!importedBy.has(cand)) importedBy.set(cand, new Set())
        importedBy.get(cand).add(f)
        break
      }
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

const report = []
for (const comp of changedComponents) {
  const tokens = tokensFor(comp)
  if (!tokens.size) continue
  const specs = new Set()
  for (const [f, text] of e2eText) {
    if (![...tokens].some((t) => text.includes(t))) continue
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
