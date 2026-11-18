import { Browser, BrowserContext, Locator, Page, Route } from '@playwright/test';
import { SecretsHelper } from './secrets-helpers';
import { apiLogin, detectAuthType } from './auth.helper';
import { BASE_URL } from '../servers';

/**
 * Background-job outcomes on demand, for specs about what the browser does
 * with a handed-off write: a write answers 202 with a job, and every poll of
 * that job answers whatever the spec set last. The backend's own side (CF
 * jobs, brokers, replicas) is covered by its Go tests and by
 * async-service-writes.spec.ts against a real broker.
 */
export type JobAnswer =
  | { state: 'PROCESSING' }
  | { state: 'COMPLETE'; result?: unknown }
  | { state: 'FAILED'; detail: string }
  /** An HTTP error from the poll itself, e.g. 404 (job unknown). */
  | { status: number }
  /** No response at all, as when the network drops. */
  | { abort: true }
  /** Let the real backend answer (e.g. a 401 once the session has ended). */
  | { real: true };

export class FakeJob {
  private answer: JobAnswer = { state: 'PROCESSING' };
  private readonly polls = new Map<Page, number>();
  private readonly startedAt = new Date().toISOString();

  constructor(readonly id: string, readonly kind = 'cf.service_instance.create') {}

  set(answer: JobAnswer): void {
    this.answer = answer;
  }

  /** Polls of this job a page has made so far. */
  pollsFrom(page: Page): number {
    return this.polls.get(page) ?? 0;
  }

  /** Answers this job's polls from every page of target. */
  async attach(target: Page | BrowserContext): Promise<void> {
    await target.route(`**/pp/v1/stratos/jobs/${encodeURIComponent(this.id)}`, route => this.respond(route));
  }

  /** The 202 a write answers with when it hands off to this job. */
  async handOff(route: Route): Promise<void> {
    await route.fulfill({ status: 202, json: this.job('PROCESSING') });
  }

  private job(state: string, extra: object = {}): object {
    return { id: this.id, kind: this.kind, state, startedAt: this.startedAt, updatedAt: new Date().toISOString(), ...extra };
  }

  private async respond(route: Route): Promise<void> {
    const page = route.request().frame().page();
    this.polls.set(page, this.pollsFrom(page) + 1);
    const a = this.answer;
    if ('real' in a) {
      await route.fallback();
    } else if ('abort' in a) {
      await route.abort('internetdisconnected');
    } else if ('status' in a) {
      await route.fulfill({ status: a.status, json: { error: `e2e: poll answered ${a.status}` } });
    } else if (a.state === 'FAILED') {
      await route.fulfill({
        json: this.job('FAILED', { errors: [{ code: 'cf.v3.10009', message: 'CF-UnableToPerform', detail: a.detail }] }),
      });
    } else if (a.state === 'COMPLETE') {
      await route.fulfill({ json: this.job('COMPLETE', { result: a.result ?? {} }) });
    } else {
      await route.fulfill({ json: this.job('PROCESSING') });
    }
  }
}

/** Fakes the next write to url (method) as handed off to job. */
export async function handOffWrite(page: Page | BrowserContext, url: string, method: string, job: FakeJob): Promise<void> {
  await page.route(url, route => (route.request().method() === method ? job.handOff(route) : route.fallback()));
}

/**
 * A logged-in admin in its own browser context. The worker's shared context
 * would carry browser storage (tracked writes) and a sign-out into later
 * tests; this one is closed with the test.
 */
export async function isolatedAdmin(browser: Browser): Promise<{ context: BrowserContext; page: Page; logIn: () => Promise<void> }> {
  const secrets = SecretsHelper.load();
  const baseURL = BASE_URL;
  const authType = await detectAuthType(baseURL);
  // An empty storageState: otherwise the context inherits the project's saved
  // admin login, and its cookie, shared with the worker's session.
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    baseURL,
    storageState: { cookies: [], origins: [] },
  });
  const logIn = async () => {
    await apiLogin(context.request, baseURL, secrets.console.admin.username, secrets.console.admin.password, authType);
  };
  await logIn();
  return { context, page: await context.newPage(), logIn };
}

/** The pop-up message whose text matches. */
export function toast(page: Page, text: string | RegExp): Locator {
  return page.locator('.snackbar-message').filter({ hasText: text });
}
