import { test as setup } from '@playwright/test';

import { CF_ROLES, roleStatePath } from './auth.constants';
import { detectAuthType, browserLogin } from './helpers/auth.helper';
import { EndpointManagementHelper } from './helpers/endpoint-management.helper';
import { RequestHelper } from './helpers/request.helper';
import { SecretsHelper } from './helpers/secrets-helpers';

/**
 * One saved session per CF role, consumed by the `role-*` projects in
 * playwright.config.ts.
 *
 * Each test logs the console in as the role's own CF user and then connects
 * the CF endpoint with the same credentials, so the role's token is the one
 * every proxied call in that project carries. That needs UAA
 * (`AUTH_ENDPOINT_TYPE=remote`) auth, where a console user *is* a CF user:
 * local auth has exactly one console user and cannot express roles.
 *
 * Runs after 'setup', which registered the endpoint as admin; nothing here
 * registers anything, so the four tests are safe to run in parallel. A role
 * whose credentials are missing from the secrets profile fails here, loudly,
 * rather than running its suite as some other identity.
 */
for (const role of CF_ROLES) {
  setup(`authenticate as ${role}`, async ({ page, baseURL }) => {
    const url = baseURL || 'https://localhost:5540';
    const endpoint = SecretsHelper.load().cloudFoundry[0];
    const creds = SecretsHelper.roleCreds(endpoint.name, role);

    const authType = await detectAuthType(url);
    if (authType === 'sso') {
      throw new Error(
        `E2E_ROLE_NEEDS_PASSWORD_AUTH: the ${role} session logs in with the role user's password, but this console uses SSO`
      );
    }

    const request = new RequestHelper(url);
    await request.init();
    await request.createSessionWithCredentials(creds.username, creds.password);
    await new EndpointManagementHelper(url).connectAllEndpointsWithCredentials(request, creds);
    await request.dispose();

    await browserLogin(page, creds.username, creds.password, authType);
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await page.context().storageState({ path: roleStatePath(role) });
  });
}
