import { APIResponse, expect, Page } from '@playwright/test';

import { ADMIN_STATE, CfRole, roleFromProjectName } from '../../auth.constants';
import { test as base } from '../../fixtures/test-base';
import { CFApiHelper } from '../../helpers/cf-api.helper';
import { RequestHelper } from '../../helpers/request.helper';
import { SecretsHelper } from '../../helpers/secrets-helpers';

/**
 * Shared ground for the role suites (e2e/tests/roles/**), which run once per
 * CF role as that role's saved console session — see the `role-*` projects
 * in playwright.config.ts and e2e/auth.roles.setup.ts.
 */

export interface RoleContext {
  page: Page;
  role: CfRole;
  /** The CF username this session's token belongs to. */
  username: string;
  cfGuid: string;
  orgGuid: string;
  spaceGuid: string;
}

export const test = base.extend<{ roleContext: RoleContext }>({
  /**
   * The role's page, with the CF endpoint resolved and its token checked:
   * a role suite must never run on a missing or foreign token, so both
   * fail here rather than passing vacuously downstream.
   */
  roleContext: async ({ page, secrets }, use, testInfo) => {
    const role = roleFromProjectName(testInfo.project.name);
    if (!role) {
      throw new Error(`E2E_NOT_A_ROLE_PROJECT: '${testInfo.project.name}' — role specs run only under the role-* projects`);
    }
    const cfConfig = secrets.cloudFoundry[0];
    const { username } = SecretsHelper.roleCreds(cfConfig.name, role);

    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    const endpoints: any[] = await (await page.request.get('/api/v1/endpoints')).json();
    const cf = endpoints.find(ep => ep.cnsi_type === 'cf');
    if (!cf) {
      throw new Error('E2E_NO_CF_ENDPOINT: no CF endpoint is registered');
    }
    if (cf.connectionStatus !== 'connected') {
      throw new Error(`E2E_NO_CF_TOKEN: the ${role} session has no connected CF token — auth.roles.setup.ts did not connect it`);
    }
    if (cf.user?.name && cf.user.name !== username) {
      throw new Error(`E2E_WRONG_IDENTITY: the CF token belongs to '${cf.user.name}', expected '${username}'`);
    }

    await use({ page, role, username, cfGuid: cf.guid, orgGuid: cfConfig.testOrgGuid, spaceGuid: cfConfig.testSpaceGuid });
  },
});

export { expect };

/** A permission-gated control must not be rendered at all for this role. */
export async function expectAbsent(page: Page, dataTest: string): Promise<void> {
  await expect(page.locator(`[data-test="${dataTest}"]`)).toHaveCount(0);
}

/**
 * A CF v3 call proxied through jetstream as the current session — the way
 * to attempt what the UI (correctly) offers no control for.
 */
export async function proxied(
  page: Page,
  cfGuid: string,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  data?: unknown,
): Promise<APIResponse> {
  const verify = await page.request.get('/api/v1/auth/verify');
  const xsrf = verify.headers()['x-xsrf-token'];
  return page.request.fetch(`/pp/v1/proxy/v3${path}`, {
    method,
    data,
    headers: {
      'x-cap-cnsi-list': cfGuid,
      'x-cap-passthrough': 'true',
      'Content-Type': 'application/json',
      ...(xsrf ? { 'x-xsrf-token': xsrf } : {}),
    },
  });
}

/**
 * CF API as admin, for seeding and cleanup the role itself may not do.
 * Reuses the admin session the 'setup' project saved.
 */
export async function adminCfApi(baseURL: string): Promise<{
  api: CFApiHelper;
  cfGuid: string;
  /** Proxied CF call as admin for what CFApiHelper has no method for. */
  call: (method: 'GET' | 'POST' | 'PATCH' | 'DELETE', path: string, data?: unknown) => Promise<any>;
  dispose: () => Promise<void>;
}> {
  const request = new RequestHelper(baseURL);
  await request.initFromStorageState(ADMIN_STATE);
  const endpoints = await request.get('/api/v1/endpoints');
  const cf = endpoints.find((ep: any) => ep.cnsi_type === 'cf');
  if (!cf) {
    throw new Error('E2E_NO_CF_ENDPOINT: no CF endpoint is registered');
  }
  const api = new CFApiHelper(request, cf.guid);
  await api.init();
  const headers = { 'x-cap-cnsi-list': cf.guid, 'x-cap-passthrough': 'true' };
  const call = (method: 'GET' | 'POST' | 'PATCH' | 'DELETE', path: string, data?: unknown) => {
    const url = `/pp/v1/proxy/v3${path}`;
    switch (method) {
      case 'GET': return request.get(url, headers);
      case 'POST': return request.post(url, data, headers);
      case 'PATCH': return request.patch(url, data, headers);
      case 'DELETE': return request.delete(url, headers);
    }
  };
  return { api, cfGuid: cf.guid, call, dispose: () => request.dispose() };
}

/** Strip a user of every role in the test org and space, as admin. */
export async function clearUserRoles(
  admin: Awaited<ReturnType<typeof adminCfApi>>,
  username: string,
  orgGuid: string,
  spaceGuid: string,
): Promise<string> {
  const users = await admin.call('GET', `/users?usernames=${encodeURIComponent(username)}`);
  const userGuid = users?.resources?.[0]?.guid;
  if (!userGuid) {
    throw new Error(`E2E_NO_SUCH_USER: '${username}' does not exist on the CF`);
  }
  // Space roles first: CF refuses to drop the org user role while any remain.
  for (const scope of [`space_guids=${spaceGuid}`, `organization_guids=${orgGuid}`]) {
    const roles = await admin.call('GET', `/roles?user_guids=${userGuid}&${scope}&per_page=100`);
    for (const role of roles?.resources ?? []) {
      await admin.call('DELETE', `/roles/${role.guid}`);
    }
  }
  return userGuid;
}

/** Names of the roles a user holds in the test org and space, as admin. */
export async function userRoles(
  admin: Awaited<ReturnType<typeof adminCfApi>>,
  userGuid: string,
  orgGuid: string,
  spaceGuid: string,
): Promise<string[]> {
  const roles = await admin.call('GET', `/roles?user_guids=${userGuid}&organization_guids=${orgGuid}&space_guids=${spaceGuid}&per_page=100`);
  return (roles?.resources ?? []).map((r: any) => r.type as string).sort();
}

/** Unique, role-tagged name for anything a run creates. */
export const runName = (role: CfRole, what: string): string =>
  `role-${role}-${what}-${Date.now().toString(36)}`;

/** Grant one CF role to a user in the test org or space, as admin. */
export async function grantRole(
  admin: Awaited<ReturnType<typeof adminCfApi>>,
  type: 'organization_user' | 'organization_manager' | 'organization_auditor' | 'space_developer' | 'space_manager' | 'space_auditor',
  userGuid: string,
  target: { orgGuid?: string; spaceGuid?: string },
): Promise<void> {
  const relationships = type.startsWith('organization_')
    ? { user: { data: { guid: userGuid } }, organization: { data: { guid: target.orgGuid } } }
    : { user: { data: { guid: userGuid } }, space: { data: { guid: target.spaceGuid } } };
  await admin.call('POST', '/roles', { type, relationships });
}

/** The console base URL, for hooks that run outside a test's fixtures. */
export const consoleUrl = (): string => process.env.E2E_BASE_URL || 'https://localhost:5540';
