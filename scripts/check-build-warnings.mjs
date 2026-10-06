#!/usr/bin/env bun
// Runs the production frontend build and fails it on any warning that
// scripts/build-warnings-allowed.mjs does not list. The Angular build exits 0
// on a warning, so a budget overrun or a new compiler warning used to pass
// the gate unnoticed. Allowed warnings print with their reason on every
// build. Each entry allows exactly `count` matching warnings (default 1):
// one more is a new warning, and fewer means the entry must shrink, so the
// list only ever holds warnings that still happen.

import { spawn } from 'node:child_process'
import { pathToFileURL } from 'node:url'
import { ALLOWED_BUILD_WARNINGS } from './build-warnings-allowed.mjs'

const ANSI = /\x1b\[[0-9;]*m/g

export function checkWarnings(output, allowed) {
  const warnings = [...output.replace(ANSI, '').matchAll(/\[WARNING\] (.+)/g)].map((m) => m[1].trim())
  const matched = new Map(allowed.map((a) => [a, 0]))
  const noted = []
  const unexpected = []
  for (const warning of warnings) {
    const entry = allowed.find((a) => a.pattern.test(warning))
    if (entry && matched.get(entry) < (entry.count ?? 1)) {
      matched.set(entry, matched.get(entry) + 1)
      noted.push({ warning, reason: entry.reason })
    } else {
      unexpected.push(warning)
    }
  }
  const shrunk = allowed
    .filter((a) => matched.get(a) < (a.count ?? 1))
    .map((a) => ({ pattern: a.pattern, count: a.count ?? 1, seen: matched.get(a) }))
  return { noted, unexpected, shrunk }
}

function main() {
  const build = spawn('bun', ['run', 'build'], { stdio: ['inherit', 'pipe', 'pipe'] })
  let output = ''
  build.stdout.on('data', (d) => { output += d; process.stdout.write(d) })
  build.stderr.on('data', (d) => { output += d; process.stderr.write(d) })
  build.on('close', (code) => {
    if (code !== 0) process.exit(code ?? 1)

    const { noted, unexpected, shrunk } = checkWarnings(output, ALLOWED_BUILD_WARNINGS)
    for (const n of noted) console.log(`Noted build warning (${n.reason}): ${n.warning}`)
    for (const w of unexpected) console.error(`New build warning: ${w}`)
    for (const s of shrunk) {
      console.error(`Allowed build warning ${s.pattern} occurred ${s.seen} of ${s.count} times: ` +
        (s.seen ? `lower its count to ${s.seen}` : 'remove it') + ' in scripts/build-warnings-allowed.mjs')
    }
    if (unexpected.length || shrunk.length) {
      console.error('Fix the warning, or list it with a reason in scripts/build-warnings-allowed.mjs.')
      process.exit(1)
    }
  })
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main()
