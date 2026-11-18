import { test } from 'node:test'
import assert from 'node:assert/strict'
import { checkWarnings } from '../check-build-warnings.mjs'

// The shape Angular's esbuild builder prints: a coloured "▲ [WARNING]"
// header line, then indented detail lines.
const budget = '\x1b[33m▲ \x1b[43;33m[\x1b[43;30mWARNING\x1b[43;33m]\x1b[0m \x1b[1mchunk-I5FozcMY.js exceeded maximum budget. Budget 2.75 MB was not met by 16.15 kB with a total of 2.77 MB.\x1b[0m\n'
const sass = (file) => `▲ [WARNING] Deprecation in ${file} [plugin angular-sass]\n\n    ${file}:3:8:\n`
const output = `Building...\n${budget}\n${sass('a.scss')}Application bundle generation complete.\n`
const sassEntry = (count) => ({ pattern: /^Deprecation in .* \[plugin angular-sass\]/, reason: 'upstream theme', count })

test('a clean build has nothing to report', () => {
  assert.deepEqual(checkWarnings('Application bundle generation complete.\n', []),
    { noted: [], unexpected: [], shrunk: [] })
})

test('unlisted warnings are unexpected, with ANSI colours stripped', () => {
  const { unexpected } = checkWarnings(output, [])
  assert.deepEqual(unexpected, [
    'chunk-I5FozcMY.js exceeded maximum budget. Budget 2.75 MB was not met by 16.15 kB with a total of 2.77 MB.',
    'Deprecation in a.scss [plugin angular-sass]',
  ])
})

test('a listed warning is noted with its reason, not failed', () => {
  const { noted, unexpected, shrunk } = checkWarnings(output, [sassEntry()])
  assert.deepEqual(noted, [{ warning: 'Deprecation in a.scss [plugin angular-sass]', reason: 'upstream theme' }])
  assert.equal(unexpected.length, 1)
  assert.deepEqual(shrunk, [])
})

test('one more warning than the count allows is unexpected', () => {
  const four = ['a', 'b', 'c', 'd'].map((f) => sass(`${f}.scss`)).join('')
  const { noted, unexpected, shrunk } = checkWarnings(four, [sassEntry(3)])
  assert.equal(noted.length, 3)
  assert.deepEqual(unexpected, ['Deprecation in d.scss [plugin angular-sass]'])
  assert.deepEqual(shrunk, [])
})

test('fewer warnings than the count must shrink the entry', () => {
  const two = sass('a.scss') + sass('b.scss')
  const { shrunk } = checkWarnings(two, [sassEntry(3)])
  assert.deepEqual(shrunk, [{ pattern: sassEntry().pattern, count: 3, seen: 2 }])
})

test('an entry that matches nothing must be removed', () => {
  const entry = { pattern: /exceeded maximum budget/, reason: 'old' }
  const { shrunk } = checkWarnings(sass('a.scss'), [entry])
  assert.deepEqual(shrunk, [{ pattern: entry.pattern, count: 1, seen: 0 }])
})
