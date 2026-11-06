import { Page, APIRequestContext, request as playwrightRequest, chromium } from '@playwright/test';
import { fillAngularLogin } from './angular-input.helper';

/**
 * Auth type detection and login helpers.
 *
 * Stratos supports two auth modes:
 *   - Local: username/password form, AUTH_ENDPOINT_TYPE=local
 *   - SSO:   browser redirect to UAA login page, then back to Stratos
 *
 * Detection: GET /api/v1/auth/verify returns x-stratos-sso-login header
 * when SSO is enabled. The frontend uses the same check.
 */

export type AuthType = 'local' | 'sso';

/**
 * Detect whether the Stratos instance uses local auth or SSO.
 */
export async function detectAuthType(baseURL: string): Promise<AuthType> {
  const ctx = await playwrightRequest.newContext({
    baseURL,
    ignoreHTTPSErrors: true,
  });

  try {
    const resp = await ctx.get('/api/v1/auth/verify');
    const ssoHeader = resp.headers()['x-stratos-sso-login'];
    return ssoHeader ? 'sso' : 'local';
  } catch {
    return 'local';
  } finally {
    await ctx.dispose();
  }
}

/**
 * Login via browser — works for both local and SSO auth.
 *
 * Local: fills the Angular login form using native value setter.
 * SSO:   follows the redirect to UAA, fills the UAA form (standard HTML),
 *        waits for redirect back to Stratos.
 */
export async function browserLogin(
  page: Page,
  username: string,
  password: string,
  authType: AuthType
): Promise<void> {
  if (authType === 'local') {
    await browserLoginLocal(page, username, password);
  } else {
    await browserLoginSSO(page, username, password);
  }
}

/**
 * Local auth: Angular form with OnPush change detection.
 */
async function browserLoginLocal(
  page: Page,
  username: string,
  password: string
): Promise<void> {
  await page.goto('/login');

  // Give the local form time to appear; if it doesn't, fall back to SSO.
  // Some deployments report 'local' auth type but redirect the login page to SSO/UAA.
  const formVisible = await page.locator('input[name="username"]').first()
    .waitFor({ state: 'visible', timeout: 20000 })
    .then(() => true)
    .catch(() => false);

  if (!formVisible) {
    await browserLoginSSO(page, username, password);
    return;
  }

  await fillAngularLogin(page, username, password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/^(?!.*\/login)/, { timeout: 15000 }).catch(async (e: Error) => {
    // Firefox throws NS_BINDING_ABORTED when the redirect binding is aborted mid-flight.
    // The redirect is still in progress — retry waitForURL to let it complete.
    if (e.message?.includes('NS_BINDING_ABORTED')) {
      await page.waitForURL(/^(?!.*\/login)/, { timeout: 10000 });
      return;
    }
    throw e;
  });
}

/**
 * SSO auth: redirect to UAA login page, fill standard HTML form, redirect back.
 *
 * Flow:
 *   1. Navigate to /login — Stratos detects SSO, shows SSO login button
 *   2. Click SSO button (or auto-redirect)
 *   3. UAA login page loads (standard HTML, not Angular)
 *   4. Fill username/password with standard fill() and submit
 *   5. UAA redirects back to Stratos via /pp/v1/auth/sso_login_callback
 *   6. Stratos sets session cookie and redirects to home
 */
async function browserLoginSSO(
  page: Page,
  username: string,
  password: string
): Promise<void> {
  await page.goto('/login');

  // Wait for either SSO button or auto-redirect to UAA
  const ssoButton = page.locator('button').filter({ hasText: /sign in|sso|log in/i }).first();
  const uaaForm = page.locator('form#loginForm, form[action*="login.do"], input[name="username"]').first();

  // Either SSO button appears on Stratos login page, or we auto-redirect to UAA
  const ssoVisible = await ssoButton.isVisible({ timeout: 5000 }).catch(() => false);
  const uaaVisible = await uaaForm.isVisible({ timeout: 1000 }).catch(() => false);

  if (ssoVisible && !uaaVisible) {
    // Click SSO login button — triggers redirect to UAA
    await ssoButton.click();
  }

  // Wait for UAA login page to load
  await page.waitForURL(/.*login.*|.*uaa.*|.*oauth.*/, { timeout: 15000 });

  // UAA login page is standard HTML — Playwright fill() works
  const uaaUsername = page.locator('input[name="username"], input[id="username"]').first();
  const uaaPassword = page.locator('input[name="password"], input[id="password"]').first();
  const uaaSubmit = page.locator('input[type="submit"], button[type="submit"]').first();

  await uaaUsername.waitFor({ state: 'visible', timeout: 10000 });
  await uaaUsername.fill(username);
  await uaaPassword.fill(password);
  await uaaSubmit.click();

  // Wait for redirect back to Stratos (away from UAA)
  await page.waitForURL(/^(?!.*(uaa|login\.sys|oauth))/, { timeout: 45000 });
}

/**
 * API-level login — establishes a Stratos session via HTTP requests.
 *
 * Local: POST /pp/v1/auth/login/uaa with form data.
 * SSO:   Follow the OAuth redirect chain through UAA.
 */
export async function apiLogin(
  context: APIRequestContext,
  baseURL: string,
  username: string,
  password: string,
  authType: AuthType
): Promise<{ xsrfToken?: string }> {
  if (authType === 'local') {
    return apiLoginLocal(context, username, password);
  } else {
    return apiLoginSSO(context, baseURL, username, password);
  }
}

/**
 * Local API login — direct POST with credentials.
 */
async function apiLoginLocal(
  context: APIRequestContext,
  username: string,
  password: string
): Promise<{ xsrfToken?: string }> {
  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);

  const response = await context.post('/pp/v1/auth/login/uaa', {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    data: formData.toString(),
  });

  const xsrfToken = response.headers()['x-xsrf-token'];
  return { xsrfToken };
}

/**
 * SSO API login — uses a headless browser to complete the OAuth flow.
 *
 * Raw HTTP requests can't handle the SSO flow reliably because:
 * - UAA login form requires a CSRF token (X-Uaa-Csrf)
 * - Cookies need to be maintained across domain boundaries (Stratos ↔ UAA)
 * - Multiple redirects with state parameters
 *
 * Instead, we launch a headless browser, complete the SSO login, extract
 * the session cookie, and recreate the API context with that cookie.
 */
async function apiLoginSSO(
  _context: APIRequestContext,
  baseURL: string,
  username: string,
  password: string
): Promise<{ xsrfToken?: string }> {
  const browser = await chromium.launch();
  const browserContext = await browser.newContext({ ignoreHTTPSErrors: true });

  try {
    const page = await browserContext.newPage();

    // Complete SSO login via browser
    await page.goto(`${baseURL}/login`);

    // Click SSO sign in button
    const ssoButton = page.locator('button').filter({ hasText: /sign in|sso|log in/i }).first();
    const ssoVisible = await ssoButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (ssoVisible) {
      await ssoButton.click();
    }

    // Wait for UAA login page
    await page.waitForURL(/.*login.*|.*uaa.*|.*oauth.*/, { timeout: 15000 });

    // Fill UAA form (standard HTML — fill() works fine)
    const uaaUsername = page.locator('input[name="username"], input[id="username"]').first();
    const uaaPassword = page.locator('input[name="password"], input[id="password"]').first();
    const uaaSubmit = page.locator('input[type="submit"], button[type="submit"]').first();

    await uaaUsername.waitFor({ state: 'visible', timeout: 10000 });
    await uaaUsername.fill(username);
    await uaaPassword.fill(password);
    await uaaSubmit.click();

    // Wait for redirect back to Stratos
    await page.waitForURL(/^(?!.*(uaa|login\.sys|oauth))/, { timeout: 20000 });

    // Extract session cookie and XSRF token from the browser context
    const cookies = await browserContext.cookies(baseURL);
    const sessionCookie = cookies.find(c => c.name === 'console-session');

    // Get XSRF token via API call using browser's session
    const verifyResp = await page.request.get('/api/v1/auth/verify');
    const xsrfToken = verifyResp.headers()['x-xsrf-token'];

    // Store cookies globally so the original context can be recreated with them
    // We attach the cookie info to the return value for the caller to use
    return {
      xsrfToken,
      sessionCookie: sessionCookie ? `${sessionCookie.name}=${sessionCookie.value}` : undefined,
      cookies,
    } as any;
  } finally {
    await browser.close();
  }
}
