import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { e2eServers } from '../../e2e/servers.ts'

test('defaults to the e2e ports on localhost', () => {
  assert.deepEqual(e2eServers({}), { backendPort: '5543', frontendPort: '5540', baseURL: 'https://localhost:5540' })
})

test('E2E_FRONTEND_PORT moves the base URL and E2E_BACKEND_PORT the backend', () => {
  assert.deepEqual(e2eServers({ E2E_FRONTEND_PORT: '5580', E2E_BACKEND_PORT: '5583' }),
    { backendPort: '5583', frontendPort: '5580', baseURL: 'https://localhost:5580' })
})

test('the old FRONTEND_PORT and BACKEND_PORT still work', () => {
  assert.deepEqual(e2eServers({ FRONTEND_PORT: '5580', BACKEND_PORT: '5583' }),
    { backendPort: '5583', frontendPort: '5580', baseURL: 'https://localhost:5580' })
})

test('the E2E_ names win over the old ones', () => {
  const env = { E2E_FRONTEND_PORT: '5580', E2E_BACKEND_PORT: '5583', FRONTEND_PORT: '5440', BACKEND_PORT: '5443' }
  assert.deepEqual(e2eServers(env),
    { backendPort: '5583', frontendPort: '5580', baseURL: 'https://localhost:5580' })
})

test('E2E_BASE_URL wins over E2E_FRONTEND_PORT', () => {
  const env = { E2E_BASE_URL: 'https://console.example.test', E2E_FRONTEND_PORT: '5580' }
  assert.equal(e2eServers(env).baseURL, 'https://console.example.test')
})

// A fallback such as `|| 'https://localhost:5540'` sends a run on other
// ports to whatever serves 5540; the URL comes from e2e/servers.ts only.
test('no e2e file hard-codes a localhost console URL', () => {
  const root = fileURLToPath(new URL('../../e2e/', import.meta.url))
  const offenders = readdirSync(root, { recursive: true })
    .filter((f) => f.endsWith('.ts') && f !== 'servers.ts')
    .filter((f) => /https?:\/\/(localhost|127\.0\.0\.1):\d/.test(readFileSync(root + f, 'utf8')))
  assert.deepEqual(offenders, [])
})
