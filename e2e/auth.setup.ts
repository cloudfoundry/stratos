import { test as setup } from '@playwright/test';
import { SecretsHelper } from './helpers/secrets-helpers';
import { EndpointManagementHelper } from './helpers/endpoint-management.helper';
import { ConsoleUserType } from './helpers/request.helper';
import { detectAuthType, browserLogin } from './helpers/auth.helper';
import { ADMIN_STATE, USER_STATE } from './auth.constants';

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

  const authType = await detectAuthType(baseURL || 'https://localhost:5540');
  await browserLogin(page, username, password, authType);
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

  await page.context().storageState({ path: USER_STATE });
});

