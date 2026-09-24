#!/usr/bin/env node
// Explain a lockfile change by package, not by line.
//
// A dependency bump can rewrite thousands of lockfile lines, and a text diff
// cannot say which of them the bump required and which are side effects:
// packages that only moved in the tree, duplicates that incremental
// resolution left behind, or unrelated upgrades that a regenerated lockfile
// picked up. This compares two lockfiles by package identity (name@version)
// and reports:
//
//   - identities added and removed, and package names new, gone or
//     re-versioned;
//   - identities that kept their version but moved in the tree (hoisting);
//   - the origin of every added or removed identity: the highest changed
//     package below the direct dependency on its shortest path from the
//     root. A vite 7 -> 8 bump that brings in its own subtree is then one
//     line, "vite@8.3.0", instead of dozens of unrelated-looking entries.
//
// Reads npm package-lock.json (v2/v3) and bun.lock. An argument of the form
// <rev>:<path> is read from git, so a branch can be checked against its base:
//
//   node scripts/lockdiff.mjs origin/develop:bun.lock bun.lock
//   node scripts/lockdiff.mjs HEAD~1:src/frontend/packages/devkit/package-lock.json \
//     src/frontend/packages/devkit/package-lock.json --detail
//
// --detail lists every re-versioned, new and gone package name; --all lists
// every origin instead of the largest fifteen.

import { readFileSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { basename } from 'node:path'
import { pathToFileURL } from 'node:url'

// A lockfile as a tree: key -> { name, version, parent, deps }. `parent` is
// the key the package is nested under ('' for the top level), which is all
// module resolution needs.
export function parseLock(text, file) {
  return basename(file.replace(/^[^:]*:/, '')) === 'bun.lock' ? parseBun(text) : parseNpm(text)
}

function parseNpm(text) {
  const lock = JSON.parse(text)
  const nodes = new Map()
  for (const [key, e] of Object.entries(lock.packages ?? {})) {
    if (key === '' || e.link) continue
    const at = key.lastIndexOf('node_modules/')
    nodes.set(key, {
      name: e.name ?? key.slice(at + 'node_modules/'.length),
      version: e.version,
      parent: at <= 0 ? '' : key.slice(0, at - 1),
      deps: depNames(e),
    })
  }
  const root = lock.packages?.[''] ?? {}
  return { nodes, direct: depNames(root), child: (base, name) => (base ? `${base}/node_modules/${name}` : `node_modules/${name}`) }
}

function parseBun(text) {
  // bun.lock is JSON with trailing commas.
  const lock = JSON.parse(text.replace(/,(\s*[}\]])/g, '$1'))
  const nodes = new Map()
  for (const [key, entry] of Object.entries(lock.packages ?? {})) {
    const id = entry[0]
    const at = id.lastIndexOf('@')
    const name = id.slice(0, at)
    const meta = entry.find((x, i) => i > 0 && x && typeof x === 'object' && !Array.isArray(x)) ?? {}
    nodes.set(key, {
      name,
      version: id.slice(at + 1),
      parent: key === name ? '' : key.slice(0, key.length - name.length - 1),
      deps: depNames(meta),
    })
  }
  const direct = [...new Set(Object.values(lock.workspaces ?? {}).flatMap(depNames))]
  return { nodes, direct, child: (base, name) => (base ? `${base}/${name}` : name) }
}

function depNames(e) {
  return Object.keys({ ...e.dependencies, ...e.devDependencies, ...e.optionalDependencies, ...e.peerDependencies })
}

// Node-style resolution: the nearest copy of `name` from `from` upwards.
function resolve(lock, from, name) {
  for (let base = from; ; base = lock.nodes.get(base)?.parent ?? '') {
    const key = lock.child(base, name)
    if (lock.nodes.has(key)) return key
    if (base === '') return null
  }
}

const idOf = (n) => `${n.name}@${n.version}`

function identities(lock) {
  const ids = new Map()
  for (const [key, n] of lock.nodes) {
    const id = idOf(n)
    if (!ids.has(id)) ids.set(id, [])
    ids.get(id).push(key)
  }
  return ids
}

function versionsByName(ids) {
  const byName = new Map()
  for (const id of ids.keys()) {
    const at = id.lastIndexOf('@')
    const name = id.slice(0, at)
    if (!byName.has(name)) byName.set(name, new Set())
    byName.get(name).add(id.slice(at + 1))
  }
  return byName
}

// Breadth-first from the direct dependencies: each reachable key's
// predecessor on a shortest path from the root.
function shortestPaths(lock) {
  const prev = new Map()
  const queue = []
  for (const d of lock.direct) {
    const key = resolve(lock, '', d)
    if (key && !prev.has(key)) { prev.set(key, null); queue.push(key) }
  }
  while (queue.length) {
    const key = queue.shift()
    for (const d of lock.nodes.get(key).deps) {
      const r = resolve(lock, key, d)
      if (r && !prev.has(r)) { prev.set(r, key); queue.push(r) }
    }
  }
  return prev
}

function origins(lock, ids, changed) {
  const prev = shortestPaths(lock)
  const out = new Map()
  for (const id of changed) {
    const keys = ids.get(id)
    let key = keys.find((k) => prev.has(k))
    const chain = []
    while (key) { chain.unshift(key); key = prev.get(key) }
    // chain[0] is the direct dependency; the origin is the highest changed
    // package after it, or the direct dependency itself.
    const hit = chain.slice(1).find((k) => changed.has(idOf(lock.nodes.get(k))))
    const origin = hit ? idOf(lock.nodes.get(hit))
      : chain.length ? `${idOf(lock.nodes.get(chain[0]))} (direct)` : '(unreachable)'
    if (!out.has(origin)) out.set(origin, [])
    out.get(origin).push(id)
  }
  return [...out].sort((x, y) => y[1].length - x[1].length || (x[0] < y[0] ? -1 : 1))
}

export function diffLocks(a, b) {
  const ia = identities(a)
  const ib = identities(b)
  const na = versionsByName(ia)
  const nb = versionsByName(ib)
  const same = (x, y) => [...x].sort().join() === [...y].sort().join()
  const added = [...ib.keys()].filter((id) => !ia.has(id))
  const removed = [...ia.keys()].filter((id) => !ib.has(id))
  return {
    entries: [a.nodes.size, b.nodes.size],
    identities: [ia.size, ib.size],
    added,
    removed,
    newNames: [...nb.keys()].filter((n) => !na.has(n)),
    goneNames: [...na.keys()].filter((n) => !nb.has(n)),
    reversioned: [...nb.keys()].filter((n) => na.has(n) && !same(na.get(n), nb.get(n)))
      .map((n) => [n, [...na.get(n)].sort(), [...nb.get(n)].sort()]),
    relocated: [...ib.keys()].filter((id) => ia.has(id) && !same(ia.get(id), ib.get(id))),
    addedOrigins: origins(b, ib, new Set(added)),
    removedOrigins: origins(a, ia, new Set(removed)),
  }
}

function read(arg) {
  if (existsSync(arg)) return readFileSync(arg, 'utf8')
  const colon = arg.indexOf(':')
  if (colon > 0) return execFileSync('git', ['show', arg], { encoding: 'utf8', maxBuffer: 1 << 28 })
  throw new Error(`${arg}: no such file, and not a <rev>:<path>`)
}

function main(argv) {
  const files = argv.filter((x) => !x.startsWith('--'))
  if (files.length !== 2) {
    console.error('usage: node scripts/lockdiff.mjs <old-lock> <new-lock> [--detail] [--all]')
    process.exit(2)
  }
  const [a, b] = files.map((f) => parseLock(read(f), f))
  const d = diffLocks(a, b)
  const limit = argv.includes('--all') ? Infinity : 15

  console.log(`entries             ${d.entries[0]} -> ${d.entries[1]}`)
  console.log(`name@version        ${d.identities[0]} -> ${d.identities[1]}  (+${d.added.length} / -${d.removed.length})`)
  console.log(`package names       ${d.newNames.length} new, ${d.goneNames.length} gone, ${d.reversioned.length} re-versioned`)
  console.log(`moved in tree only  ${d.relocated.length}`)
  for (const [title, list] of [['added', d.addedOrigins], ['removed', d.removedOrigins]]) {
    if (!list.length) continue
    console.log(`\n${title}, by origin:`)
    for (const [origin, ids] of list.slice(0, limit)) console.log(`  ${String(ids.length).padStart(4)}  ${origin}`)
    if (list.length > limit) console.log(`        ... ${list.length - limit} more (--all)`)
  }
  if (argv.includes('--detail')) {
    console.log('\nre-versioned:')
    for (const [n, from, to] of d.reversioned.sort()) console.log(`  ${n}: ${from.join(', ')} -> ${to.join(', ')}`)
    console.log(`new: ${d.newNames.sort().join(' ') || '-'}`)
    console.log(`gone: ${d.goneNames.sort().join(' ') || '-'}`)
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main(process.argv.slice(2))
