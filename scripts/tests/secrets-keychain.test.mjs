import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync, execFileSync } from 'node:child_process'
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

// The openssl backend of secrets.sh reading its passphrase from the macOS
// Keychain. A fake `security` first on PATH stands in for the Keychain, so
// the real one is never called.

const script = fileURLToPath(new URL('../secrets.sh', import.meta.url))
const service = 'stratos-e2e-secrets-test'
const passphrase = 'test-only-passphrase'
const plaintext = 'consoleUsers:\n  admin:\n    username: test-admin\n'
const openssl = execFileSync('/bin/sh', ['-c', 'command -v openssl'], { encoding: 'utf8' }).trim()

// Prints the passphrase, newline-terminated like the real command, for the
// one known service and account; any other item is "not found".
const fakeSecurity = `#!/bin/sh
service= account= reveal=
while [ $# -gt 0 ]; do
  case "$1" in
    -s) service="$2"; shift 2 ;;
    -a) account="$2"; shift 2 ;;
    -w) reveal=1; shift ;;
    *) shift ;;
  esac
done
if [ "$service" != "${service}" ] || [ "$account" != "passphrase" ]; then
  echo "security: SecKeychainSearchCopyNext: The specified item could not be found in the keychain." >&2
  exit 44
fi
if [ -n "$reveal" ]; then echo "${passphrase}"; else echo "keychain: \\"test\\""; fi
`

function sandbox() {
  const dir = mkdtempSync(join(tmpdir(), 'secrets-keychain-'))
  const bin = join(dir, 'bin')
  mkdirSync(bin)
  writeFileSync(join(bin, 'security'), fakeSecurity)
  chmodSync(join(bin, 'security'), 0o755)
  return { dir, bin }
}

function run(dir, args, env) {
  return spawnSync('/bin/bash', [script, ...args], {
    cwd: dir,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 20000,
    env: { HOME: dir, ...env },
  })
}

const withFake = (bin, extra = {}) => ({ PATH: `${bin}:${process.env.PATH}`, ...extra })

test('encrypt then decrypt round-trips through the Keychain passphrase', () => {
  const { dir, bin } = sandbox()
  try {
    writeFileSync(join(dir, 'secrets.yaml'), plaintext)
    const env = withFake(bin, { STRATOS_SECRETS_KEYCHAIN: service })
    const enc = run(dir, ['encrypt'], env)
    assert.equal(enc.status, 0, enc.stderr)
    rmSync(join(dir, 'secrets.yaml'))
    const dec = run(dir, ['decrypt'], env)
    assert.equal(dec.status, 0, dec.stderr)
    assert.equal(readFileSync(join(dir, 'secrets.yaml'), 'utf8'), plaintext)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('--keychain names the service on the command line', () => {
  const { dir, bin } = sandbox()
  try {
    writeFileSync(join(dir, 'secrets.yaml'), plaintext)
    const enc = run(dir, ['encrypt', '--keychain', service], withFake(bin))
    assert.equal(enc.status, 0, enc.stderr)
    const dec = spawnSync(openssl, ['enc', '-aes-256-cbc', '-d', '-pbkdf2', '-pass', `pass:${passphrase}`,
      '-in', join(dir, 'secrets.yaml.enc')], { encoding: 'utf8' })
    assert.equal(dec.status, 0, dec.stderr)
    assert.equal(dec.stdout, plaintext)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

// A file made the old way, with the passphrase typed at openssl's prompt,
// is the same as one made with -pass pass:.
test('a file encrypted by plain openssl decrypts through the Keychain', () => {
  const { dir, bin } = sandbox()
  try {
    writeFileSync(join(dir, 'plain.yaml'), plaintext)
    execFileSync(openssl, ['enc', '-aes-256-cbc', '-salt', '-pbkdf2', '-pass', `pass:${passphrase}`,
      '-in', join(dir, 'plain.yaml'), '-out', join(dir, 'secrets.local.yaml.enc')])
    const dec = run(dir, ['decrypt', '--env', 'local'], withFake(bin, { STRATOS_SECRETS_KEYCHAIN: service }))
    assert.equal(dec.status, 0, dec.stderr)
    assert.equal(readFileSync(join(dir, 'secrets.local.yaml'), 'utf8'), plaintext)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

// run-e2e decrypts to memory and execs bunx; a fake bunx prints what it got.
test('run-e2e hands the Keychain-decrypted secrets to the test run', () => {
  const { dir, bin } = sandbox()
  try {
    writeFileSync(join(bin, 'bunx'), '#!/bin/sh\nprintf "%s" "$STRATOS_SECRETS"\n')
    chmodSync(join(bin, 'bunx'), 0o755)
    writeFileSync(join(dir, 'plain.yaml'), plaintext)
    execFileSync(openssl, ['enc', '-aes-256-cbc', '-salt', '-pbkdf2', '-pass', `pass:${passphrase}`,
      '-in', join(dir, 'plain.yaml'), '-out', join(dir, 'secrets.yaml.enc')])
    const e2e = run(dir, ['run-e2e', '--keychain', service], withFake(bin))
    assert.equal(e2e.status, 0, e2e.stderr)
    assert.ok(e2e.stdout.endsWith(plaintext.trimEnd()), e2e.stdout)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('a missing Keychain item fails loudly and writes nothing', () => {
  const { dir, bin } = sandbox()
  try {
    writeFileSync(join(dir, 'secrets.yaml'), plaintext)
    const enc = run(dir, ['encrypt'], withFake(bin, { STRATOS_SECRETS_KEYCHAIN: 'no-such-service' }))
    assert.notEqual(enc.status, 0)
    assert.match(enc.stderr, /no Keychain item for service 'no-such-service'/)
    assert.equal(existsSync(join(dir, 'secrets.yaml.enc')), false)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('without a security command the Keychain source fails loudly', () => {
  const { dir } = sandbox()
  const bin = join(dir, 'openssl-only')
  try {
    mkdirSync(bin)
    symlinkSync(openssl, join(bin, 'openssl'))
    writeFileSync(join(dir, 'secrets.yaml'), plaintext)
    const enc = run(dir, ['encrypt'], { PATH: bin, STRATOS_SECRETS_KEYCHAIN: service })
    assert.notEqual(enc.status, 0)
    assert.match(enc.stderr, /'security' command not found/)
    assert.equal(existsSync(join(dir, 'secrets.yaml.enc')), false)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
