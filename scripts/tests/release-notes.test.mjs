import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const script = join(import.meta.dirname, '../../build/release-notes.sh')

// The suggested subcategories, as changelog.d/README.md carries them.
const readme = '# changelog.d\n\n<!-- subcategories -->\n- Performance\n- Services\n<!-- /subcategories -->\n'

// Assemble the given fragments ({ name: body }) from a scratch directory.
// Outside a repo every fragment sorts by filename, so names set the order.
function assemble(fragments) {
  const dir = mkdtempSync(join(tmpdir(), 'release-notes-'))
  writeFileSync(join(dir, 'README.md'), readme)
  for (const [name, body] of Object.entries(fragments)) writeFileSync(join(dir, name), body)
  const run = spawnSync('bash', [script, 'assemble'], { env: { ...process.env, FRAG_DIR: dir, ROOT_DIR: dir }, encoding: 'utf8' })
  return { out: run.stdout, err: run.stderr, status: run.status }
}

test('plain sections assemble as before', () => {
  const { out, status } = assemble({
    '0001-a.md': '[Features]\n- One.\n',
    '0002-b.md': '[BugFixes]\n- Two.\n\n[Features]\n- Three.\n',
  })
  assert.equal(status, 0)
  assert.equal(out, '## Features\n\n- One.\n- Three.\n\n## Bug Fixes\n\n- Two.\n')
})

test('subcategories group across fragments, after the plain bullets, in list order', () => {
  const { out, err, status } = assemble({
    '0001-a.md': '[Features: Services]\n- S1.\n',
    '0002-b.md': '[Features]\n- Plain.\n\n[Features: Performance]\n- P1.\n',
    '0003-c.md': '[Features:Services]\n- S2.\n',
  })
  assert.equal(status, 0)
  assert.equal(err, '')
  assert.equal(out, '## Features\n\n- Plain.\n\n### Performance\n\n- P1.\n\n### Services\n\n- S1.\n- S2.\n')
})

test('a subcategory not on the list still assembles, after the listed ones, with a note', () => {
  const { out, err, status } = assemble({
    '0001-a.md': '[BugFixes: Organizations]\n- O1.\n',
    '0002-b.md': '[BugFixes: Performance]\n- P1.\n',
  })
  assert.equal(status, 0)
  assert.equal(out, '## Bug Fixes\n\n### Performance\n\n- P1.\n\n### Organizations\n\n- O1.\n')
  assert.match(err, /new subcategory \[BugFixes: Organizations\]/)
  assert.match(err, /changelog\.d\/README\.md/)
})

test('the section before the colon must still be a known one', () => {
  const { status, err } = assemble({ '0001-a.md': '[Feature: Performance]\n- X.\n' })
  assert.notEqual(status, 0)
  assert.match(err, /unknown section \[Feature\]/)
})
