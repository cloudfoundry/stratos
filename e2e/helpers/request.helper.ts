import { APIRequestContext, request as playwrightRequest } from '@playwright/test';
import { SecretsHelper } from './secrets-helpers';
import { detectAuthType, apiLogin, AuthType } from './auth.helper';

/**
 * User Type Enum
 */
export enum ConsoleUserType {
  admin = 'admin',
  user = 'user'
}

/**
 * Request Helper
 * Handles HTTP requests to Stratos backend API
 * Migrated from Protractor RequestHelpers
 */
export class RequestHelper {
  private context?: APIRequestContext;
  private xsrfToken?: string;
  private baseURL: string;
  private secrets = SecretsHelper.load();
  private authType?: AuthType;

  constructor(baseURL: string = 'https://127.0.0.1:4200') {
    this.baseURL = baseURL;
  }

  /**
   * Initialize request context (must be called before making requests)
   */
  async init(): Promise<void> {
    this.context = await playwrightRequest.newContext({
      baseURL: this.baseURL,
      ignoreHTTPSErrors: true,
      extraHTTPHeaders: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // Detect auth type once
    if (!this.authType) {
      this.authType = await detectAuthType(this.baseURL);
    }
  }

  /**
   * Get the detected auth type for this instance
   */
  getAuthType(): AuthType {
    return this.authType || 'local';
  }

  /**
   * Create a session by logging in.
   * Supports both local auth (password POST) and SSO (OAuth redirect flow).
   *
   * For SSO, the login is done via a headless browser. The session cookie
   * is extracted and used to recreate the API request context.
   */
  async createSession(userType: ConsoleUserType): Promise<void> {
    if (!this.context) {
      await this.init();
    }

    const creds = userType === ConsoleUserType.admin
      ? { username: this.secrets.console.admin.username, password: this.secrets.console.admin.password }
      : { username: this.secrets.console.user.username, password: this.secrets.console.user.password };

    const result = await apiLogin(
      this.context!,
      this.baseURL,
      creds.username,
      creds.password,
      this.authType || 'local'
    );

    if (result.xsrfToken) {
      this.xsrfToken = result.xsrfToken;
    }

    // For SSO, recreate the context with the session cookie from the browser.
    // The Cookie header is set globally so every request carries the session.
    const ssoResult = result as any;
    if (ssoResult.sessionCookie) {
      await this.context!.dispose();
      this.context = await playwrightRequest.newContext({
        baseURL: this.baseURL,
        ignoreHTTPSErrors: true,
        extraHTTPHeaders: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cookie': ssoResult.sessionCookie,
        },
      });

      // Fetch a fresh XSRF token using the new context
      const verifyResp = await this.context.get('/api/v1/auth/verify');
      const freshXsrf = verifyResp.headers()['x-xsrf-token'];
      if (freshXsrf) {
        this.xsrfToken = freshXsrf;
      }
    }
  }

  /**
   * Send GET request
   */
  async get(url: string): Promise<any> {
    if (!this.context) {
      throw new Error('Request context not initialized. Call init() first.');
    }

    const headers: Record<string, string> = {};
    if (this.xsrfToken) {
      headers['x-xsrf-token'] = this.xsrfToken;
    }

    const response = await this.context.get(url, { headers });

    // Update XSRF token if provided
    const newToken = response.headers()['x-xsrf-token'];
    if (newToken) {
      this.xsrfToken = newToken;
    }

    if (response.ok()) {
      const text = await response.text();
      return text ? JSON.parse(text) : null;
    }

    throw new Error(`GET ${url} failed: ${response.status()} ${response.statusText()}`);
  }

  /**
   * Send POST request with form data
   */
  async postForm(url: string, formData: Record<string, string>): Promise<any> {
    if (!this.context) {
      throw new Error('Request context not initialized. Call init() first.');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded'
    };
    if (this.xsrfToken) {
      headers['x-xsrf-token'] = this.xsrfToken;
    }

    const data = new URLSearchParams();
    Object.entries(formData).forEach(([key, value]) => {
      data.append(key, value);
    });

    const response = await this.context.post(url, {
      headers,
      data: data.toString()
    });

    // Update XSRF token
    const newToken = response.headers()['x-xsrf-token'];
    if (newToken) {
      this.xsrfToken = newToken;
    }

    if (response.ok()) {
      const text = await response.text();
      return text ? JSON.parse(text) : null;
    }

    throw new Error(`POST ${url} failed: ${response.status()} ${response.statusText()}`);
  }

  /**
   * Send POST request with JSON body
   */
  async post(url: string, body?: any): Promise<any> {
    if (!this.context) {
      throw new Error('Request context not initialized. Call init() first.');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (this.xsrfToken) {
      headers['x-xsrf-token'] = this.xsrfToken;
    }

    const response = await this.context.post(url, {
      headers,
      data: body ? JSON.stringify(body) : undefined
    });

    // Update XSRF token
    const newToken = response.headers()['x-xsrf-token'];
    if (newToken) {
      this.xsrfToken = newToken;
    }

    if (response.ok()) {
      const text = await response.text();
      return text ? JSON.parse(text) : null;
    }

    throw new Error(`POST ${url} failed: ${response.status()} ${response.statusText()}`);
  }

  /**
   * Send PATCH request with JSON body
   */
  async patch(url: string, body?: any): Promise<any> {
    if (!this.context) {
      throw new Error('Request context not initialized. Call init() first.');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (this.xsrfToken) {
      headers['x-xsrf-token'] = this.xsrfToken;
    }

    const response = await this.context.patch(url, {
      headers,
      data: body ? JSON.stringify(body) : undefined
    });

    // Update XSRF token
    const newToken = response.headers()['x-xsrf-token'];
    if (newToken) {
      this.xsrfToken = newToken;
    }

    if (response.ok()) {
      const text = await response.text();
      return text ? JSON.parse(text) : null;
    }

    throw new Error(`PATCH ${url} failed: ${response.status()} ${response.statusText()}`);
  }

  /**
   * Send DELETE request
   */
  async delete(url: string): Promise<any> {
    if (!this.context) {
      throw new Error('Request context not initialized. Call init() first.');
    }

    const headers: Record<string, string> = {};
    if (this.xsrfToken) {
      headers['x-xsrf-token'] = this.xsrfToken;
    }

    const response = await this.context.delete(url, { headers });

    // Update XSRF token
    const newToken = response.headers()['x-xsrf-token'];
    if (newToken) {
      this.xsrfToken = newToken;
    }

    if (response.ok()) {
      const text = await response.text();
      return text ? JSON.parse(text) : null;
    }

    throw new Error(`DELETE ${url} failed: ${response.status()} ${response.statusText()}`);
  }

  /**
   * Clean up request context
   */
  async dispose(): Promise<void> {
    if (this.context) {
      await this.context.dispose();
      this.context = undefined;
      this.xsrfToken = undefined;
    }
  }
}
