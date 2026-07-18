#!/usr/bin/env node
// Every data-test hook referenced by an e2e spec must exist in a component
// template, so a renamed or removed hook turns red on the PR that breaks it
// instead of leaving the spec silently matching nothing (#5619).
//
// Files on the e2e legacy list (tools/eslint-rules/e2e-legacy-files.mjs) are
// skipped — their selectors are rewritten wholesale when they are modernised.
// Dynamic values (template interpolation) cannot be checked and are skipped.

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { E2E_LEGACY_FILES } from '../tools/eslint-rules/e2e-legacy-files.mjs'

const legacy = new Set(E2E_LEGACY_FILES)

function files(dir, ext) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    if (name === 'node_modules') return []
    if (statSync(p).isDirectory()) return files(p, ext)
    return ext.some((e) => name.endsWith(e)) ? [p] : []
  })
}

// data-test values referenced from e2e code: attribute selectors in any
// quote style, and getByTestId() calls.
const REF_PATTERNS = [
  /data-test[~^$*|]?=\\?["']([^"'\\]+)/g,
  /getByTestId\(\s*["']([^"']+)/g,
]

// data-test values components define: static attributes, plus every quoted
// string fragment inside a dynamic [attr.data-test] binding ('refresh' and
// 'refresh-loading' out of a ternary, prefixes like 'header-action-').
const STATIC_DEF = /(?<!\[attr\.)data-test=["']([^"']+)/g
const DYNAMIC_DEF = /\[attr\.data-test\]="([^"]*)"/g

const defined = new Set()
for (const f of files('src/frontend', ['.html', '.ts'])) {
  const text = readFileSync(f, 'utf8')
  for (const m of text.matchAll(STATIC_DEF)) defined.add(m[1])
  for (const m of text.matchAll(DYNAMIC_DEF)) {
    for (const s of m[1].matchAll(/'([^']+)'/g)) defined.add(s[1])
  }
}

const problems = []
for (const f of files('e2e', ['.ts'])) {
  if (legacy.has(f)) continue
  const text = readFileSync(f, 'utf8')
  const lines = text.split('\n')
  for (const pattern of REF_PATTERNS) {
    for (const m of text.matchAll(pattern)) {
      const value = m[1]
      if (value.includes('$') || value.includes('{')) continue // dynamic
      // 'header-action-' + label style bindings define a prefix, not a value.
      const prefixed = [...defined].some((d) => d.endsWith('-') && value.startsWith(d))
      if (!defined.has(value) && !prefixed) {
        const line = text.slice(0, m.index).split('\n').length
        problems.push(`${f}:${line}  data-test "${value}" is not defined in any component template`)
      }
    }
  }
}

if (problems.length) {
  console.error(`e2e data-test drift (${problems.length}):`)
  for (const p of problems) console.error('  ' + p)
  process.exit(1)
}
console.log(`e2e data-test hooks OK (${defined.size} defined in templates)`)
