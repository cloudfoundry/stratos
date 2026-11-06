#!/usr/bin/env node
// Cross-run comparison for Playwright `results.json` reports. Classifies
// every test that failed in at least one input run:
//   deterministic — failed in every run where it executed
//   flaky         — failed in some runs, passed in others (3+ runs)
//   fixed/regressed — mixed outcome, exactly two runs given in order
//                     (old new): failed->passed is fixed, passed->failed
//                     is regressed
// Also reports per-run totals and an error-class summary (first line of
// each failure's error message, grouped). Archived-data tool: takes
// results.json files as input, never runs Playwright itself.
//
// A test's identity is its file path + full describe/test title chain
// (same convention e2e-run.mjs uses for its own failed-test list) —
// stable across separate invocations and across browser projects, so a
// chromium run and a webkit run of the same spec line up as "the same
// test". A single results.json covering multiple browser projects (e.g.
// a combined baseline) collapses to one outcome per test per run: fail if
// any project failed it, pass only if every project that ran it passed.
// A test absent from a run (not executed there, e.g. skipped or out of
// scope) doesn't count against that run for determinism.
//
// Usage: node scripts/e2e-flake-diff.mjs <results1.json> <results2.json> [...more] [--json]

import { readFileSync } from 'node:fs'
import path from 'node:path'

const JSON_OUT = process.argv.includes('--json')
const files = process.argv.slice(2).filter((a) => a !== '--json')
if (files.length < 2) {
  console.error('Usage: node scripts/e2e-flake-diff.mjs <results1.json> <results2.json> [...more] [--json]')
  process.exit(1)
}

const stripAnsi = (s) => s.replace(new RegExp(String.fromCharCode(27) + '\\[[0-9;]*m', 'g'), '')

function loadRun(file) {
  const raw = JSON.parse(readFileSync(file, 'utf8'))
  const label = path.basename(file, '.json')
  const s = raw.stats ?? {}
  const stats = {
    passed: (s.expected ?? 0) + (s.flaky ?? 0),
    failed: s.unexpected ?? 0,
    skipped: s.skipped ?? 0,
  }
  stats.total = stats.passed + stats.failed + stats.skipped

  // key (file + title chain, no project) -> { title, outcome: 'pass'|'fail' }
  const tests = new Map()
  // every failing (test, project) instance, kept separately so a run that
  // spans several browser projects doesn't lose error-text diversity when
  // its per-test outcomes collapse into one entry above.
  const rawFailures = []
  const walk = (suite, crumbs) => {
    const next = suite.title && suite.title !== suite.file ? [...crumbs, suite.title] : crumbs
    for (const sub of suite.suites ?? []) walk(sub, next)
    for (const spec of suite.specs ?? []) {
      const key = `${spec.file}::${[...next, spec.title].join(' › ')}`
      const title = `${spec.file} › ${[...next, spec.title].join(' › ')}`
      for (const test of spec.tests ?? []) {
        if (test.status === 'skipped') continue // not executed — doesn't count either way
        const outcome = test.status === 'unexpected' ? 'fail' : 'pass'
        const existing = tests.get(key)
        if (!existing || (existing.outcome === 'pass' && outcome === 'fail')) tests.set(key, { title, outcome })
        if (outcome === 'fail') {
          const results = test.results ?? []
          const last = results[results.length - 1]
          const msg = last?.error?.message
          const errorLine = msg ? stripAnsi(msg.split('\n')[0]).trim().slice(0, 160) : null
          rawFailures.push({ title: `${title} [${test.projectName}]`, errorLine })
        }
      }
    }
  }
  for (const s of raw.suites ?? []) walk(s, [])
  return { file, label, stats, tests, rawFailures }
}

const runs = files.map(loadRun)

// Registry: key -> { title, perRun: (outcome|undefined)[] }
const registry = new Map()
runs.forEach((run, i) => {
  for (const [key, { title, outcome }] of run.tests) {
    if (!registry.has(key)) registry.set(key, { title, perRun: new Array(runs.length) })
    registry.get(key).perRun[i] = outcome
  }
})

const twoRunOrdered = runs.length === 2
const buckets = { deterministic: [], flaky: [], fixed: [], regressed: [] }
for (const [key, entry] of registry) {
  const executed = entry.perRun.filter(Boolean)
  if (!executed.includes('fail')) continue // only tests that failed somewhere
  const allFail = executed.every((o) => o === 'fail')
  if (allFail) {
    buckets.deterministic.push({ key, ...entry })
  } else if (twoRunOrdered) {
    if (entry.perRun[0] === 'fail' && entry.perRun[1] === 'pass') buckets.fixed.push({ key, ...entry })
    else if (entry.perRun[0] === 'pass' && entry.perRun[1] === 'fail') buckets.regressed.push({ key, ...entry })
    // else: not executed in one of the two runs but failed in the other — deterministic, handled above
  } else {
    buckets.flaky.push({ key, ...entry })
  }
}
for (const b of Object.values(buckets)) b.sort((a, c) => a.title.localeCompare(c.title))

// Error-class summary: group every failing (test, run) instance by the
// first line of its error message.
const errorClasses = new Map() // line -> { count, example }
for (const run of runs) {
  for (const { errorLine, title } of run.rawFailures) {
    if (!errorLine) continue
    if (!errorClasses.has(errorLine)) errorClasses.set(errorLine, { count: 0, example: title })
    errorClasses.get(errorLine).count++
  }
}
const errorClassList = [...errorClasses.entries()]
  .map(([line, v]) => ({ line, ...v }))
  .sort((a, b) => b.count - a.count)

if (JSON_OUT) {
  console.log(JSON.stringify({
    runs: runs.map((r) => ({ file: r.file, label: r.label, stats: r.stats })),
    mode: twoRunOrdered ? 'fixed-regressed' : 'flaky',
    classification: {
      deterministic: buckets.deterministic.map(({ title, perRun }) => ({ title, perRun })),
      flaky: buckets.flaky.map(({ title, perRun }) => ({ title, perRun })),
      fixed: buckets.fixed.map(({ title, perRun }) => ({ title, perRun })),
      regressed: buckets.regressed.map(({ title, perRun }) => ({ title, perRun })),
    },
    errorClasses: errorClassList,
  }, null, 2))
  process.exit(0)
}

console.log(`e2e flake-diff — comparing ${runs.length} runs:`)
for (const r of runs) console.log(`  ${r.label}  (${r.file})`)

console.log('\nPer-run totals:')
console.log(`  ${'run'.padEnd(28)} total  passed  failed  skipped`)
for (const r of runs) {
  console.log(`  ${r.label.padEnd(28)} ${String(r.stats.total).padStart(5)}  ${String(r.stats.passed).padStart(6)}  ${String(r.stats.failed).padStart(6)}  ${String(r.stats.skipped).padStart(7)}`)
}

console.log('\nClassification (tests that failed in at least one run):')
console.log(`  deterministic: ${buckets.deterministic.length}`)
if (twoRunOrdered) {
  console.log(`  fixed:         ${buckets.fixed.length}  (failed in '${runs[0].label}', passed in '${runs[1].label}')`)
  console.log(`  regressed:     ${buckets.regressed.length}  (passed in '${runs[0].label}', failed in '${runs[1].label}')`)
} else {
  console.log(`  flaky:         ${buckets.flaky.length}`)
}

const LIST_CAP = 20
function printBucket(name, list) {
  if (!list.length) return
  console.log(`\n${name} (${list.length}):`)
  for (const t of list.slice(0, LIST_CAP)) console.log(`  - ${t.title}`)
  if (list.length > LIST_CAP) console.log(`  ...and ${list.length - LIST_CAP} more (use --json for the full list)`)
}
printBucket('Flaky', buckets.flaky)
printBucket('Fixed', buckets.fixed)
printBucket('Regressed', buckets.regressed)

if (errorClassList.length) {
  console.log('\nError classes (first line of error, across all failing instances):')
  for (const e of errorClassList.slice(0, 15)) console.log(`  ${String(e.count).padStart(4)}x  ${e.line}`)
  if (errorClassList.length > 15) console.log(`  ...and ${errorClassList.length - 15} more classes (use --json for the full list)`)
}
