#!/usr/bin/env node
// Every test hook referenced by an e2e spec must exist in a component
// template, so a renamed or removed hook turns red on the PR that breaks it
// instead of leaving the spec silently matching nothing (#5619).
//
// Two attribute namespaces are checked independently: data-test (the
// house convention) and data-testid (used by a few components, and what
// Playwright's getByTestId targets since playwright.config.ts sets no
// testIdAttribute).
//
// Files on the e2e legacy list (tools/eslint-rules/e2e-legacy-files.mjs) are
// skipped — their selectors are rewritten wholesale when they are modernised.
// Dynamic values (template interpolation) cannot be checked and are skipped.

import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { E2E_LEGACY_FILES } from '../tools/eslint-rules/e2e-legacy-files.mjs'

// All paths are repo-root-relative with '/' separators, on every platform:
// built that way below, matching the legacy list's entries.
process.chdir(fileURLToPath(new URL('..', import.meta.url)))

const legacy = new Set(E2E_LEGACY_FILES)

function files(dir, ext) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === 'node_modules') return []
    const p = `${dir}/${entry.name}`
    if (entry.isDirectory()) return files(p, ext)
    return ext.some((e) => entry.name.endsWith(e)) ? [p] : []
  })
}

const NAMESPACES = {
  'data-test': {
    refPatterns: [/data-test[~^$*|]?=\\?["']([^"'\\]+)/g],
    defined: new Set(),
  },
  'data-testid': {
    refPatterns: [/data-testid[~^$*|]?=\\?["']([^"'\\]+)/g, /getByTestId\(\s*["']([^"']+)/g],
    defined: new Set(),
  },
}

// Definitions components provide: static attributes, plus every quoted
// string fragment inside a dynamic [attr.data-test] binding ('refresh' and
// 'refresh-loading' out of a ternary, prefixes like 'header-action-').
// A data-testid ref must not match a data-test definition, so the static
// data-test pattern excludes the 'id'-suffixed attribute via (?!id).
const DEFS = {
  'data-test': [/(?<!\[attr\.)data-test(?!id)=["']([^"']+)/g, /\[attr\.data-test\]="([^"]*)"/g],
  'data-testid': [/(?<!\[attr\.)data-testid=["']([^"']+)/g, /\[attr\.data-testid\]="([^"]*)"/g],
}

// Suffix vocabulary for prefix-style bindings ('header-action-' + act.label):
// every label/textLabel string literal in app code or templates, plus
// explicit dataTest config values. A static e2e ref under a live prefix must
// end in one of these, so a renamed action label turns the old ref red.
const SUFFIX_SOURCES = [
  /\b(?:label|textLabel):\s*['"]([^'"]+)['"]/g,
  /\b(?:label|textLabel)=["']([^"']+)["']/g,
]
const suffixes = new Set()

for (const f of files('src/frontend', ['.html', '.ts'])) {
  const text = readFileSync(f, 'utf8')
  for (const [ns, [staticDef, dynamicDef]] of Object.entries(DEFS)) {
    for (const m of text.matchAll(staticDef)) NAMESPACES[ns].defined.add(m[1])
    for (const m of text.matchAll(dynamicDef)) {
      for (const s of m[1].matchAll(/'([^']+)'/g)) NAMESPACES[ns].defined.add(s[1])
    }
  }
  for (const pattern of SUFFIX_SOURCES) {
    for (const m of text.matchAll(pattern)) suffixes.add(m[1])
  }
  // dataTest config values (SignalListRowAction etc.) are full definitions.
  for (const m of text.matchAll(/\bdataTest:\s*['"]([^'"]+)['"]/g)) NAMESPACES['data-test'].defined.add(m[1])
}

// 'header-action-' + label style bindings define a prefix, not a value.
// simplification: suffixes validate against harvested label literals, not
// shared test-id constants — a label anywhere in src satisfies any prefix.
// Tighten to per-prefix vocabularies if cross-component collisions bite.
for (const ns of Object.values(NAMESPACES)) {
  ns.prefixes = [...ns.defined].filter((d) => d.endsWith('-'))
}

const problems = []
for (const f of files('e2e', ['.ts'])) {
  if (legacy.has(f)) continue
  const text = readFileSync(f, 'utf8')
  for (const [nsName, ns] of Object.entries(NAMESPACES)) {
    for (const pattern of ns.refPatterns) {
      for (const m of text.matchAll(pattern)) {
        const value = m[1]
        if (value.includes('$') || value.includes('{')) continue // dynamic
        if (value.includes('<')) continue // doc-comment placeholder, e.g. page-tab-<label>
        if (ns.defined.has(value)) continue
        const line = () => text.slice(0, m.index).split('\n').length
        const prefix = ns.prefixes.filter((p) => value.startsWith(p)).sort((a, b) => b.length - a.length)[0]
        if (!prefix) {
          problems.push(`${f}:${line()}  ${nsName} "${value}" is not defined in any component template`)
        } else if (!suffixes.has(value.slice(prefix.length))) {
          problems.push(`${f}:${line()}  ${nsName} "${value}" matches prefix "${prefix}" but "${value.slice(prefix.length)}" is not a label defined anywhere in src`)
        }
      }
    }
  }
}

if (problems.length) {
  console.error(`e2e test-hook drift (${problems.length}):`)
  for (const p of problems) console.error('  ' + p)
  process.exit(1)
}
const counts = Object.entries(NAMESPACES).map(([n, ns]) => `${ns.defined.size} ${n}`).join(', ')
console.log(`e2e test hooks OK (${counts} defined in templates)`)
