import { Page, APIRequestContext, request as playwrightRequest } from '@playwright/test';
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
  await page.locator('input[name="username"]').first().waitFor({ state: 'visible', timeout: 10000 });
  await fillAngularLogin(page, username, password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/^(?!.*\/login)/, { timeout: 15000 });
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
  await page.waitForURL(/^(?!.*(uaa|login\.sys|oauth))/, { timeout: 20000 });
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
 * SSO API login — follow OAuth redirect chain via HTTP requests.
 *
 * The Playwright request context follows redirects and maintains cookies,
 * so we can simulate the browser SSO flow:
 *   1. GET /pp/v1/auth/sso_login → redirect to UAA authorize
 *   2. GET UAA authorize → redirect to UAA login page
 *   3. POST UAA login form → redirect to Stratos callback
 *   4. Stratos callback sets session cookie
 *
 * We use a separate request context that follows redirects to handle this,
 * then transfer the session cookie to the main context.
 */
async function apiLoginSSO(
  context: APIRequestContext,
  baseURL: string,
  username: string,
  password: string
): Promise<{ xsrfToken?: string }> {
  // Create a context that follows redirects for the OAuth dance
  const ssoContext = await playwrightRequest.newContext({
    baseURL,
    ignoreHTTPSErrors: true,
  });

  try {
    // Step 1: Initiate SSO login — this redirects to UAA
    const stateUrl = encodeURIComponent(baseURL);
    const ssoResp = await ssoContext.get(`/pp/v1/auth/sso_login?state=${stateUrl}`);
    const ssoBody = await ssoResp.text();

    // Step 2: Parse the UAA login form to find the action URL
    // The redirect lands on the UAA login page with a form
    const formActionMatch = ssoBody.match(/action="([^"]+)"/);
    const uaaLoginUrl = ssoResp.url(); // Final URL after redirects

    // Step 3: POST credentials to UAA login form
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    // Determine form action — either from form HTML or the login URL
    const loginPostUrl = formActionMatch
      ? formActionMatch[1].replace(/&amp;/g, '&')
      : uaaLoginUrl;

    const loginResp = await ssoContext.post(loginPostUrl, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      data: formData.toString(),
    });

    // After successful login, UAA redirects to Stratos callback
    // which sets the session cookie. Extract XSRF token.
    const xsrfToken = loginResp.headers()['x-xsrf-token'];

    // Transfer session to the original context by making a verify call
    // The ssoContext now has the session cookie
    const verifyResp = await ssoContext.get('/api/v1/auth/verify');
    const verifyXsrf = verifyResp.headers()['x-xsrf-token'];

    return { xsrfToken: xsrfToken || verifyXsrf };
  } finally {
    await ssoContext.dispose();
  }
}
