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

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { E2E_LEGACY_FILES } from '../tools/eslint-rules/e2e-legacy-files.mjs'
import { files, contractSources, HOOK_DEFS, DATA_TEST_CONFIG } from './lib/e2e-hooks.mjs'

// All paths are repo-root-relative with '/' separators, on every platform:
// built that way below, matching the legacy list's entries.
process.chdir(fileURLToPath(new URL('..', import.meta.url)))

const legacy = new Set(E2E_LEGACY_FILES)

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

// Suffix vocabulary for prefix-style bindings ('header-action-' + act.label):
// every label/textLabel string literal in app code or templates, plus
// explicit dataTest config values. A static e2e ref under a live prefix must
// end in one of these, so a renamed action label turns the old ref red.
const SUFFIX_SOURCES = [
  /\b(?:label|textLabel):\s*['"]([^'"]+)['"]/g,
  /\b(?:label|textLabel)=["']([^"']+)["']/g,
]
// Escape hatch for labels the harvest cannot see (computed at runtime —
// variable, i18n lookup, function result). Add the rendered label here when
// a correct e2e ref fails the suffix check; keep entries commented with the
// component that renders them.
const COMPUTED_LABEL_ALLOWLIST = new Set([])
const suffixes = new Set(COMPUTED_LABEL_ALLOWLIST)

for (const f of contractSources('src/frontend')) {
  const text = readFileSync(f, 'utf8')
  for (const [ns, [staticDef, dynamicDef]] of Object.entries(HOOK_DEFS)) {
    for (const m of text.matchAll(staticDef)) NAMESPACES[ns].defined.add(m[1])
    for (const m of text.matchAll(dynamicDef)) {
      for (const s of m[1].matchAll(/'([^']+)'/g)) NAMESPACES[ns].defined.add(s[1])
    }
  }
  for (const pattern of SUFFIX_SOURCES) {
    for (const m of text.matchAll(pattern)) suffixes.add(m[1])
  }
  // dataTest config values (SignalListRowAction etc.) are full definitions.
  for (const m of text.matchAll(DATA_TEST_CONFIG)) NAMESPACES['data-test'].defined.add(m[1])
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
        if (ns.defined.has(value)) continue
        const line = () => text.slice(0, m.index).split('\n').length
        // A value is valid under ANY live prefix whose remainder is a known
        // label — don't privilege the longest match, or a nested prefix
        // ('tab-' vs 'tab-action-') could shadow a valid shorter-prefix ref.
        const prefixes = ns.prefixes.filter((p) => value.startsWith(p))
        if (!prefixes.length) {
          problems.push(`${f}:${line()}  ${nsName} "${value}" is not defined by any component (template attribute or dataTest config)`)
        } else if (!prefixes.some((p) => suffixes.has(value.slice(p.length)))) {
          problems.push(
            `${f}:${line()}  ${nsName} "${value}" matches prefix(es) ${prefixes.map((p) => `"${p}"`).join(', ')} but the remainder is not a label defined in src` +
            ' (computed label? add it to COMPUTED_LABEL_ALLOWLIST in scripts/lint-e2e-data-test.mjs)',
          )
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
