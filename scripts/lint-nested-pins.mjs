#!/usr/bin/env node
// The package.json files under src/frontend/packages/ install nothing. They
// are not workspaces and carry no lockfile, and the devkit reads them for
// dependency NAMES only (src/lib/packages.ts iterates Object.keys) — the
// version strings are never resolved. The real install is the root manifest
// plus bun.lock.
//
// They still matter, because Dependabot security updates scan every manifest
// in the repo regardless of the directory list in .github/dependabot.yml, and
// bump to the minimum patched version rather than the latest. A pin left
// behind the shipped tree therefore raises advisories against packages that
// already ship patched. That produced runs of spurious PRs across the 21.x,
// 22.0.x and 22.1.x lines, and the sync was done by hand three times before
// this check existed.
//
// So: any dependency a nested manifest declares AND root also declares must
// name the same version string as root. Dependencies absent from root are
// left alone — that covers the internal @stratosui/* cross-package peers.
//
// devkit is exempt: it has its own package-lock.json and genuinely resolves
// on its own, so it is not required to track root.

import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

process.chdir(fileURLToPath(new URL('..', import.meta.url)))

const PACKAGES = 'src/frontend/packages'
const EXEMPT = new Set(['devkit'])
const NESTED_SECTIONS = ['dependencies', 'devDependencies', 'peerDependencies']

const read = (file) => JSON.parse(readFileSync(file, 'utf8'))
const declared = (manifest, sections) =>
  Object.assign({}, ...sections.map((s) => manifest[s] || {}))

const root = declared(read('package.json'), ['dependencies', 'devDependencies'])

const drift = []
let checked = 0

for (const pkg of readdirSync(PACKAGES).sort()) {
  if (EXEMPT.has(pkg)) continue
  const file = `${PACKAGES}/${pkg}/package.json`
  if (!existsSync(file)) continue

  for (const [dep, version] of Object.entries(declared(read(file), NESTED_SECTIONS))) {
    if (!(dep in root)) continue
    checked++
    if (version !== root[dep]) drift.push({ file, dep, version, root: root[dep] })
  }
}

if (drift.length) {
  console.error(`nested manifest pin drift (${drift.length}):`)
  const width = Math.max(...drift.map((d) => d.dep.length))
  for (const d of drift) {
    console.error(`  ${d.file}`)
    console.error(`    ${d.dep.padEnd(width)}  declares ${d.version}  root installs ${d.root}`)
  }
  console.error('')
  console.error('Nothing installs from these files, so the fix is to edit the version')
  console.error('strings to match root. Commit as chore(frontend): — never chore(deps):,')
  console.error('which build/release-notes.sh harvests into the release notes.')
  process.exit(1)
}

console.log(`nested manifest pins match root (${checked} declarations)`)
