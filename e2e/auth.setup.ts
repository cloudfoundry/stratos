import { test as setup, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { SecretsHelper } from './helpers/secrets-helpers';
import { EndpointManagementHelper } from './helpers/endpoint-management.helper';
import { ConsoleUserType } from './helpers/request.helper';
import { detectAuthType, browserLogin } from './helpers/auth.helper';
import { ADMIN_STATE, USER_STATE, CF_GUIDS_FILE } from './auth.constants';

/**
 * Resolve org/space GUIDs for every configured CF endpoint via the
 * authenticated backend proxy and persist them to CF_GUIDS_FILE.
 *
 * Runs once, here, in the one-time setup project — SecretsHelper reads
 * the persisted file on every later test process instead of shelling
 * out to the cf CLI (which races the shared ~/.cf/config.json across
 * parallel workers).
 */
async function resolveAndPersistCfGuids(page: Page, cfEndpoints: any[]): Promise<void> {
  if (!Array.isArray(cfEndpoints) || cfEndpoints.length === 0) return;

  let registeredEndpoints: any;
  try {
    const endpointsResp = await page.request.get('/api/v1/endpoints');
    if (!endpointsResp.ok()) {
      console.warn(`GUID resolution: could not list endpoints (${endpointsResp.status()}); skipping.`);
      return;
    }
    registeredEndpoints = await endpointsResp.json();
  } catch (e) {
    console.warn('GUID resolution: failed to fetch/parse registered endpoints; skipping.', e);
    return;
  }

  if (!Array.isArray(registeredEndpoints) || registeredEndpoints.length === 0) {
    console.warn('GUID resolution: no registered endpoints returned; skipping.');
    return;
  }

  const guids: Record<string, { orgGuid: string; spaceGuid: string }> = {};

  for (const ep of cfEndpoints) {
    if (!ep.testOrg || !ep.testSpace) continue;

    const registered = registeredEndpoints.find((re: any) => {
      const host = re.api_endpoint?.Host ||
        (typeof re.api_endpoint === 'string' ? new URL(re.api_endpoint).host : '');
      return host && ep.url.includes(host);
    });

    if (!registered) {
      console.warn(`GUID resolution: no registered endpoint matched '${ep.name}' (${ep.url}); skipping.`);
      continue;
    }

    const proxyHeaders = { 'x-cap-cnsi-list': registered.guid, 'x-cap-passthrough': 'true' };

    try {
      const orgResp = await page.request.get(
        `/pp/v1/proxy/v3/organizations?names=${encodeURIComponent(ep.testOrg)}`,
        { headers: proxyHeaders }
      );
      const orgGuid = (await orgResp.json())?.resources?.[0]?.guid;
      if (!orgGuid) {
        console.warn(`GUID resolution: org '${ep.testOrg}' not found for endpoint '${ep.name}'; skipping.`);
        continue;
      }

      const spaceResp = await page.request.get(
        `/pp/v1/proxy/v3/spaces?names=${encodeURIComponent(ep.testSpace)}&organization_guids=${orgGuid}`,
        { headers: proxyHeaders }
      );
      const spaceGuid = (await spaceResp.json())?.resources?.[0]?.guid;
      if (!spaceGuid) {
        console.warn(`GUID resolution: space '${ep.testSpace}' not found for endpoint '${ep.name}'; skipping.`);
        continue;
      }

      guids[ep.name] = { orgGuid, spaceGuid };
    } catch (e) {
      console.warn(`GUID resolution failed for endpoint '${ep.name}':`, e);
    }
  }

  if (Object.keys(guids).length > 0) {
    const guidsPath = path.join(process.cwd(), CF_GUIDS_FILE);
    fs.mkdirSync(path.dirname(guidsPath), { recursive: true });
    // __meta lets readers (SecretsHelper.resolveEndpointGuids) detect a
    // stale file — e.g. this run's setup failed to resolve GUIDs and an
    // older file is still sitting there, or the org/space it points at
    // was deleted by a clean sweep since it was written. Consumers must
    // tolerate this extra key alongside the per-endpoint entries.
    const payload = {
      ...guids,
      __meta: {
        profile: process.env.E2E_PROFILE || null,
        apiUrl: cfEndpoints[0]?.url || null,
        writtenAt: Date.now(),
      },
    };
    fs.writeFileSync(guidsPath, JSON.stringify(payload, null, 2));
  }
}

setup('authenticate as admin', async ({ page, baseURL }) => {
  const secrets = SecretsHelper.load();
  const authType = await detectAuthType(baseURL || 'https://localhost:5540');

  // Ensure endpoint is registered and connected before saving state
  const manager = new EndpointManagementHelper(baseURL);
  await manager.registerDefaultCloudFoundry();
  await manager.connectAllEndpoints(ConsoleUserType.admin);
  await manager.dispose();

  // Login via browser
  await browserLogin(page, secrets.console.admin.username, secrets.console.admin.password, authType);
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

  // page.request now carries the admin session cookie — resolve org/space
  // GUIDs through the proxy and persist them for every later test process.
  // Fail-open: GUID resolution is a bonus, not a login requirement — any
  // failure here must not prevent storageState below from being written,
  // or every downstream test cascade-fails on a missing admin session.
  try {
    await resolveAndPersistCfGuids(page, secrets.cloudFoundry);
  } catch (e) {
    console.warn('GUID resolution failed unexpectedly; continuing without persisted GUIDs.', e);
  }

  // Save authenticated state
  await page.context().storageState({ path: ADMIN_STATE });
});

setup('authenticate as user', async ({ page, baseURL }) => {
  const secrets = SecretsHelper.load();
  const { username, password } = secrets.console.user;

  // Skip if user credentials are not configured
  if (!username || !password || password.includes('REPLACE')) {
    // Save empty state so tests that need user auth are skipped gracefully
    await page.context().storageState({ path: USER_STATE });
    return;
  }

  // Connect endpoints for the user identity — mirrors the admin path above.
  // Without this, the nonAdmin identity has no CNSI token row, and any
  // proxied request it makes (e.g. via connectedEndpointsUserPage) returns
  // an empty-body 400 at the jetstream proxy layer (missing token lookup).
  // registerDefaultCloudFoundry()'s idempotence check is check-then-act
  // (GET-then-POST), which is NOT safe against concurrent callers — it's
  // only safe to call again here because the 'setup' project runs
  // non-parallel (see playwright.config.ts), guaranteeing 'authenticate as
  // admin' has already finished registering before this test starts.
  const manager = new EndpointManagementHelper(baseURL);
  await manager.registerDefaultCloudFoundry();
  await manager.connectAllEndpoints(ConsoleUserType.user);
  await manager.dispose();
  console.log('  User identity: CF endpoint connect attempted via connectAllEndpoints(ConsoleUserType.user)');

  const authType = await detectAuthType(baseURL || 'https://localhost:5540');
  await browserLogin(page, username, password, authType);
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

  await page.context().storageState({ path: USER_STATE });
});

