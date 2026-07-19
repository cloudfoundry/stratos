#!/usr/bin/env node
// Standalone label-sweep behind `make e2e clean`. Deletes every CF resource
// carrying the stratos-e2e-test metadata label, direct against the CF API
// (no Stratos proxy, no Playwright). Delete order mirrors CFApiHelper.cleanupTestResources()
// (e2e/helpers/cf-api.helper.ts): apps -> routes -> service instances ->
// spaces -> orgs, each async CF delete polled to job completion before the
// next resource type starts (a space/org delete 422s if it still contains
// something whose delete job hasn't finished).
//
// Deliberately NOT wired into global-teardown: it's an operator-run sweep
// between runs, not a per-run step, so runs stay fast.
//
// Safety: every resource this script touches must carry the
// stratos-e2e-test label. The CF label_selector query is trusted as a
// pre-filter, but every returned resource's own metadata is re-checked for
// the label before any delete happens; if the check finds even one
// resource without the label, the whole sweep aborts with nothing deleted
// (BLOCKED) rather than risk deleting something broader.
//
// Auth: UAA password grant against the public 'cf' client (id 'cf', no
// secret), discovered from the CF API root's links.uaa.href. Credentials
// come from secrets.yaml (E2E_PROFILE-selected profile) and never leave
// this process — not logged, not passed to a subprocess, not put in argv.
//
// Usage: node scripts/e2e-clean.mjs [--dry-run]

import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import https from 'node:https'
import http from 'node:http'
import { load as loadYaml } from 'js-yaml'

process.chdir(fileURLToPath(new URL('..', import.meta.url)))

const DRY_RUN = process.argv.includes('--dry-run')
const LABEL = 'stratos-e2e-test'

// ── Secrets (mirrors e2e/helpers/secrets-helpers.ts resolution order) ──

function loadSecrets() {
  let raw
  const envSecrets = process.env.STRATOS_SECRETS
  if (envSecrets) {
    raw = loadYaml(envSecrets)
  } else {
    const env = process.env.E2E_ENV
    const envPath = env ? `secrets.${env}.yaml` : null
    const secretsPath = envPath && existsSync(envPath) ? envPath : 'secrets.yaml'
    if (!existsSync(secretsPath)) {
      console.error(`secrets file not found at ${secretsPath} — see e2e/secrets.yaml.template`)
      process.exit(2)
    }
    raw = loadYaml(readFileSync(secretsPath, 'utf8'))
  }

  const profile = process.env.E2E_PROFILE || 'local'
  const secrets = raw.profiles?.[profile] ? { ...raw, ...raw.profiles[profile] } : raw
  const cfEndpoints = secrets.cloudFoundry || secrets.endpoints?.cf || []
  const cf = cfEndpoints[0]
  if (!cf?.url || !cf?.creds?.admin?.username || !cf?.creds?.admin?.password) {
    console.error(`no usable CF endpoint/admin creds in profile '${profile}' — see e2e/secrets.yaml.template`)
    process.exit(2)
  }
  return {
    apiUrl: cf.url.replace(/\/$/, ''),
    insecure: !!(cf.skipSSLValidation ?? secrets.skipSSLValidation),
    username: cf.creds.admin.username,
    password: cf.creds.admin.password,
  }
}

// ── Minimal HTTP client (node:https/http — controls TLS verification the
// way Playwright's ignoreHTTPSErrors does for the rest of e2e) ──

function httpRequest(method, url, { headers = {}, body, insecure = false } = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url)
    const lib = u.protocol === 'https:' ? https : http
    const payload = body === undefined ? undefined : (typeof body === 'string' ? body : JSON.stringify(body))
    const req = lib.request(u, {
      method,
      headers: {
        Accept: 'application/json',
        ...(payload !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      rejectUnauthorized: !insecure,
      timeout: 30000,
    }, (res) => {
      const chunks = []
      res.on('data', (c) => chunks.push(c))
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8')
        let json
        try { json = text ? JSON.parse(text) : undefined } catch { json = undefined }
        resolve({ status: res.statusCode, headers: res.headers, text, json })
      })
    })
    req.on('error', reject)
    req.on('timeout', () => req.destroy(new Error(`request timeout: ${method} ${url}`)))
    if (payload !== undefined) req.write(payload)
    req.end()
  })
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// ── Auth: UAA password grant, public 'cf' client ──

async function authenticate({ apiUrl, insecure, username, password }) {
  const root = await httpRequest('GET', `${apiUrl}/`, { insecure })
  const uaaUrl = root.json?.links?.uaa?.href
  if (root.status !== 200 || !uaaUrl) {
    throw new Error(`could not discover UAA endpoint from CF API root (HTTP ${root.status})`)
  }

  const basic = Buffer.from('cf:').toString('base64')
  const form = new URLSearchParams({ grant_type: 'password', username, password, response_type: 'token' }).toString()
  const tokenResp = await httpRequest('POST', `${uaaUrl}/oauth/token`, {
    insecure,
    headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form,
  })
  // Never log tokenResp.text/json here — on failure it may echo request
  // details back; the status code alone is enough to diagnose.
  if (tokenResp.status !== 200 || !tokenResp.json?.access_token) {
    throw new Error(`UAA authentication failed (HTTP ${tokenResp.status})`)
  }
  return tokenResp.json.access_token
}

// ── CF v3 API helpers ──

const authHeaders = (token) => ({ Authorization: `Bearer ${token}` })

async function listLabeled(ctx, kind, path) {
  const { apiUrl, token, insecure } = ctx
  const results = []
  let url = `${apiUrl}${path}?label_selector=${LABEL}&per_page=100`
  while (url) {
    const r = await httpRequest('GET', url, { headers: authHeaders(token), insecure })
    if (r.status !== 200) throw new Error(`listing ${kind} failed: HTTP ${r.status}`)
    for (const res of r.json?.resources ?? []) results.push(res)
    url = r.json?.pagination?.next?.href ?? null
  }
  return results
}

// Every resource the label_selector query returns must actually carry the
// label — trust but verify. Any miss aborts the whole sweep (see file
// header). Returns the offending resources (empty = safe to proceed).
function findUnlabeled(kind, resources) {
  return resources
    .filter((r) => !(LABEL in (r.metadata?.labels ?? {})))
    .map((r) => `${kind} ${r.name ?? r.host ?? r.guid} (${r.guid})`)
}

async function waitForJob(ctx, jobUrl, timeoutMs = 120000) {
  const { token, insecure } = ctx
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const r = await httpRequest('GET', jobUrl, { headers: authHeaders(token), insecure })
    if (r.status !== 200) throw new Error(`job poll failed: HTTP ${r.status}`)
    const state = r.json?.state
    if (state === 'COMPLETE') return
    if (state === 'FAILED') {
      const detail = (r.json?.errors ?? []).map((e) => e.detail).join('; ') || 'unknown error'
      throw new Error(`job failed: ${detail}`)
    }
    await sleep(2000)
  }
  throw new Error(`job timed out after ${timeoutMs}ms`)
}

async function deleteResource(ctx, kind, path, resource) {
  const name = resource.name ?? resource.host ?? resource.guid
  if (DRY_RUN) {
    console.log(`  [dry-run] would delete ${kind} ${name} (${resource.guid})`)
    return true
  }
  const { apiUrl, token, insecure } = ctx
  const r = await httpRequest('DELETE', `${apiUrl}${path}/${resource.guid}`, { headers: authHeaders(token), insecure })
  if (r.status === 202) {
    const jobUrl = r.headers.location
    if (!jobUrl) {
      console.warn(`  deleted ${kind} ${name} (${resource.guid}) — no job Location header, completion not confirmed`)
      return true
    }
    try {
      await waitForJob(ctx, jobUrl)
      console.log(`  deleted ${kind} ${name} (${resource.guid})`)
      return true
    } catch (e) {
      console.warn(`  FAILED ${kind} ${name} (${resource.guid}) — delete job did not complete: ${e.message}`)
      return false
    }
  }
  if (r.status === 204) {
    console.log(`  deleted ${kind} ${name} (${resource.guid})`)
    return true
  }
  if (r.status === 404) {
    // Deleted by someone/something else between our list and delete calls —
    // the end state (gone) is what we wanted, so this is success, not failure.
    console.log(`  ${kind} ${name} (${resource.guid}) already gone (404) — treating as cleaned`)
    return true
  }
  console.warn(`  FAILED to delete ${kind} ${name} (${resource.guid}): HTTP ${r.status} ${(r.text ?? '').slice(0, 300)}`)
  return false
}

// ── Main ──

const RESOURCE_TYPES = [
  { kind: 'app', path: '/v3/apps' },
  { kind: 'route', path: '/v3/routes' },
  { kind: 'service instance', path: '/v3/service_instances' },
  { kind: 'space', path: '/v3/spaces' },
  { kind: 'organization', path: '/v3/organizations' },
]

async function main() {
  const secrets = loadSecrets()
  console.log(`e2e-clean: sweeping ${secrets.apiUrl} for '${LABEL}'-labeled resources${DRY_RUN ? ' (dry run)' : ''}...`)

  let token
  try {
    token = await authenticate(secrets)
  } catch (e) {
    console.error(`BLOCKED: CF authentication failed — ${e.message}`)
    process.exit(2)
  }
  const ctx = { apiUrl: secrets.apiUrl, insecure: secrets.insecure, token }

  // Phase 1: list everything first (read-only) so the safety check below
  // can veto the entire sweep before any delete is issued.
  const byType = []
  for (const { kind, path } of RESOURCE_TYPES) {
    try {
      byType.push({ kind, path, resources: await listLabeled(ctx, kind, path) })
    } catch (e) {
      console.error(`BLOCKED: could not list ${kind}s — ${e.message}`)
      process.exit(2)
    }
  }

  const unlabeled = byType.flatMap(({ kind, resources }) => findUnlabeled(kind, resources))
  if (unlabeled.length) {
    console.error(`BLOCKED: label_selector=${LABEL} returned resource(s) without the label — refusing to delete anything:`)
    for (const u of unlabeled) console.error(`  ${u}`)
    process.exit(2)
  }

  const total = byType.reduce((n, t) => n + t.resources.length, 0)
  if (!total) {
    console.log('nothing to clean up — no labeled resources found.')
    process.exit(0)
  }

  let failures = 0
  const counts = {}
  for (const { kind, path, resources } of byType) {
    if (!resources.length) { counts[kind] = 0; continue }
    console.log(`${kind}s (${resources.length}):`)
    let ok = 0
    for (const resource of resources) {
      if (await deleteResource(ctx, kind, path, resource)) ok++
      else failures++
    }
    counts[kind] = ok
  }

  console.log('')
  console.log(`e2e-clean summary${DRY_RUN ? ' (dry run — nothing deleted)' : ''}:`)
  for (const { kind } of RESOURCE_TYPES) console.log(`  ${kind}s: ${counts[kind] ?? 0}/${byType.find((t) => t.kind === kind).resources.length}`)
  if (failures) {
    console.error(`\n${failures} resource(s) failed to delete — see FAILED lines above.`)
    process.exit(1)
  }
  process.exit(0)
}

main().catch((e) => {
  console.error(`e2e-clean: unexpected error — ${e.message}`)
  process.exit(1)
})
