import { AuthDataService } from '@stratosui/store';

export const SETUP_CONFIRM_INTERVAL_MS = 2000;
export const SETUP_CONFIRM_TIMEOUT_MS = 30000;

export const SETUP_NOT_CONFIRMED_MESSAGE =
  'The configuration was saved, but the backend did not confirm the setup in time. Reload the page to check it.';

const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

/**
 * After a setup save, poll session verification until the backend leaves
 * setup mode (the verify no longer answers "setup required").
 *
 * Resolves `false` when the backend has not confirmed within `timeoutMs`,
 * including when a verify request itself never answers, so callers can
 * always clear their busy state.
 */
export async function waitForSetupConfirmed(
  authData: AuthDataService,
  intervalMs = SETUP_CONFIRM_INTERVAL_MS,
  timeoutMs = SETUP_CONFIRM_TIMEOUT_MS,
): Promise<boolean> {
  let timedOut = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const poll = async (): Promise<boolean> => {
    while (!timedOut) {
      await authData.verifySession(true, true);
      const session = authData.sessionData();
      if (session && !session.uaaError) {
        return true;
      }
      await sleep(intervalMs);
    }
    return false;
  };

  const deadline = new Promise<boolean>(resolve => {
    timer = setTimeout(() => {
      timedOut = true;
      resolve(false);
    }, timeoutMs);
  });

  try {
    return await Promise.race([poll(), deadline]);
  } finally {
    clearTimeout(timer);
  }
}
