import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseLock, diffLocks } from '../lockdiff.mjs'

// Same change in both formats: tool 1 -> 2 swaps its bundler from
// old-bundler to new-bundler, which brings its own helper nested under it;
// shared stays at 1.0.0 but is hoisted; left-pad is untouched.
const npm = (tool, bundler, extra) => JSON.stringify({
  lockfileVersion: 3,
  packages: {
    '': { dependencies: { tool: `^${tool}.0.0`, 'left-pad': '1.0.0' } },
    'node_modules/tool': { version: `${tool}.0.0`, dependencies: { [bundler]: '*', shared: '1.0.0' } },
    [`node_modules/${bundler}`]: { version: '1.0.0', dependencies: extra ? { '@x/helper': '*' } : {} },
    ...(extra
      ? { 'node_modules/new-bundler/node_modules/@x/helper': { version: '3.0.0' }, 'node_modules/shared': { version: '1.0.0' } }
      : { 'node_modules/tool/node_modules/shared': { version: '1.0.0' } }),
    'node_modules/left-pad': { version: '1.0.0' },
  },
})

const bun = (tool, bundler, extra) => `{
  "lockfileVersion": 1,
  "workspaces": { "": { "name": "app", "dependencies": { "tool": "^${tool}.0.0", "left-pad": "1.0.0", }, }, },
  "packages": {
    "tool": ["tool@${tool}.0.0", "", { "dependencies": { "${bundler}": "*", "shared": "1.0.0" } }, "sha"],
    "${bundler}": ["${bundler}@1.0.0", "", { "dependencies": { ${extra ? '"@x/helper": "*"' : ''} } }, "sha"],
    ${extra
      ? '"new-bundler/@x/helper": ["@x/helper@3.0.0", "", {}, "sha"], "shared": ["shared@1.0.0", "", {}, "sha"],'
      : '"tool/shared": ["shared@1.0.0", "", {}, "sha"],'}
    "left-pad": ["left-pad@1.0.0", "", {}, "sha"],
  }
}`

for (const [format, make, file] of [['npm', npm, 'package-lock.json'], ['bun', bun, 'bun.lock']]) {
  test(`${format}: classifies and attributes a subtree swap`, () => {
    const d = diffLocks(parseLock(make(1, 'old-bundler', false), file), parseLock(make(2, 'new-bundler', true), file))
    assert.deepEqual(d.added.sort(), ['@x/helper@3.0.0', 'new-bundler@1.0.0', 'tool@2.0.0'])
    assert.deepEqual(d.removed.sort(), ['old-bundler@1.0.0', 'tool@1.0.0'])
    assert.deepEqual(d.reversioned, [['tool', ['1.0.0'], ['2.0.0']]])
    assert.deepEqual(d.relocated, ['shared@1.0.0'])
    assert.deepEqual(d.newNames.sort(), ['@x/helper', 'new-bundler'])
    // The nested helper is attributed to the bundler that brought it, not
    // reported as a change of its own; tool is the direct dependency.
    assert.deepEqual(Object.fromEntries(d.addedOrigins), {
      'new-bundler@1.0.0': ['new-bundler@1.0.0', '@x/helper@3.0.0'],
      'tool@2.0.0 (direct)': ['tool@2.0.0'],
    })
  })

  test(`${format}: identical lockfiles report nothing`, () => {
    const lock = parseLock(make(1, 'old-bundler', false), file)
    const d = diffLocks(lock, lock)
    assert.equal(d.added.length + d.removed.length + d.relocated.length + d.reversioned.length, 0)
  })
}

// b is nested under a and depends on c, which sits beside it under a. c is
// only reachable by walking up from b to its parent, so this fails if the
// nesting is not reconstructed.
const nestedNpm = JSON.stringify({
  lockfileVersion: 3,
  packages: {
    '': { dependencies: { a: '1.0.0' } },
    'node_modules/a': { version: '1.0.0', dependencies: { b: '*' } },
    'node_modules/a/node_modules/b': { version: '1.0.0', dependencies: { c: '*' } },
    'node_modules/a/node_modules/c': { version: '1.0.0' },
  },
})
const nestedBun = `{
  "workspaces": { "": { "dependencies": { "a": "1.0.0" } } },
  "packages": {
    "a": ["a@1.0.0", "", { "dependencies": { "b": "*" } }, "sha"],
    "a/b": ["b@1.0.0", "", { "dependencies": { "c": "*" } }, "sha"],
    "a/c": ["c@1.0.0", "", {}, "sha"],
  }
}`
const empty = { npm: JSON.stringify({ packages: { '': {} } }), bun: '{ "workspaces": { "": {} }, "packages": {} }' }

for (const [format, text, file] of [['npm', nestedNpm, 'package-lock.json'], ['bun', nestedBun, 'bun.lock']]) {
  test(`${format}: resolves through a nested parent`, () => {
    const d = diffLocks(parseLock(empty[format], file), parseLock(text, file))
    assert.deepEqual(Object.fromEntries(d.addedOrigins), {
      'b@1.0.0': ['b@1.0.0', 'c@1.0.0'],
      'a@1.0.0 (direct)': ['a@1.0.0'],
    })
  })
}
