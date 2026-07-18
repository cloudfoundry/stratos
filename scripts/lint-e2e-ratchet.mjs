#!/usr/bin/env node
// Became-clean enforcement for the e2e guard ratchet (#5619). The legacy
// list in tools/eslint-rules/e2e-legacy-files.mjs turns the drift guards
// off for files that predate them; nothing else fails when a listed file
// stops violating, so stale entries would silently keep the guards off.
// This check closes the loop: every listed file must still exist AND still
// violate at least one guard — otherwise its entry must be removed so the
// file gates red from then on.

import { ESLint } from 'eslint'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { E2E_LEGACY_FILES } from '../tools/eslint-rules/e2e-legacy-files.mjs'

process.chdir(fileURLToPath(new URL('..', import.meta.url)))

const GUARD_RULES = ['stratos/no-dead-material-selectors', 'stratos/no-hollow-assertions']

const problems = []
const existing = E2E_LEGACY_FILES.filter((f) => {
  if (existsSync(f)) return true
  problems.push(`${f}  no longer exists`)
  return false
})

// Re-run only the guard rules with the ratchet's "off" override re-enabled.
const eslint = new ESLint({
  overrideConfig: [
    {
      files: E2E_LEGACY_FILES,
      rules: Object.fromEntries(GUARD_RULES.map((r) => [r, 'error'])),
    },
  ],
})
const results = existing.length ? await eslint.lintFiles(existing) : []
for (const r of results) {
  const rel = r.filePath.replace(process.cwd() + '/', '')
  // Suppressed messages count as violations: an inline eslint-disable does
  // not make a file clean, and treating it as clean would force delisting a
  // file whose guards then never fire again.
  const allMessages = [...r.messages, ...(r.suppressedMessages ?? [])]
  const guardHits = allMessages.filter((m) => GUARD_RULES.includes(m.ruleId)).length
  if (guardHits > 0) continue
  // A parse error or an eslint-ignored file is "unverifiable", not "clean";
  // saying clean would direct the author to delist a file the guards never
  // actually checked. (Other ruleId-null messages — e.g. unused-disable-
  // directive warnings — do not block a genuine clean verdict.)
  const blocker = r.messages.find((m) => m.fatal || /File ignored/i.test(m.message))
  if (blocker) {
    problems.push(`${rel}  could not be checked (parse error or ignored): ${blocker.message.split('\n')[0]}`)
  } else {
    problems.push(`${rel}  is clean`)
  }
}

if (problems.length) {
  console.error(`e2e ratchet problems (${problems.length}) in tools/eslint-rules/e2e-legacy-files.mjs — remove entries that are clean or gone so the guards apply; fix files that could not be checked:`)
  for (const p of problems) console.error('  ' + p)
  process.exit(1)
}
console.log(`e2e ratchet OK (${E2E_LEGACY_FILES.length} legacy files, all still violating)`)
