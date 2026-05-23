// localStorage-backed cache of the username used to connect to a given
// endpoint. Written by connect.service on a successful credential connect;
// read by connect-endpoint.component to prefill the reconnect dialog after
// disconnect (backend clears endpoint.user on disconnect so the prefill
// would otherwise be lost). Per-browser-profile by nature of localStorage —
// users switching machines see no prefill, which is acceptable.

const STORAGE_PREFIX = 'stratos.endpoint.username.';

export function rememberedUsernameKey(endpointGuid: string): string {
  return `${STORAGE_PREFIX}${endpointGuid}`;
}

export function rememberUsername(endpointGuid: string, username: string): void {
  if (!username) return;
  try {
    window.localStorage?.setItem(rememberedUsernameKey(endpointGuid), username);
  } catch {
    // Private mode / quota — silent fail, prefill simply won't work.
  }
}

export function forgetRememberedUsername(endpointGuid: string): void {
  try {
    window.localStorage?.removeItem(rememberedUsernameKey(endpointGuid));
  } catch {
    // ignore
  }
}
