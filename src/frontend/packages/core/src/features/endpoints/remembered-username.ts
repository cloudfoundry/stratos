// localStorage-backed cache of the username used to connect to a given
// endpoint. Written by connect.service on a successful credential connect;
// read by connect-endpoint.component to prefill the reconnect dialog after
// disconnect (backend clears endpoint.user on disconnect so the prefill
// would otherwise be lost). Per-browser-profile by nature of localStorage —
// users switching machines see no prefill, which is acceptable.
//
// Two keys are written on every successful connect:
//
// 1. Per-endpoint slot (`stratos.endpoint.username.<guid>`) — used for
//    reconnects to the same endpoint after disconnect.
// 2. Global last-used slot (`stratos.endpoint.username.__last`) — used as
//    a fallback when the dialog opens for an endpoint with no per-endpoint
//    cache yet. Covers the common case of an operator registering several
//    of the same kind of endpoint (e.g. multiple CFs) and using the same
//    username across all of them — first connect to each new endpoint
//    prefills from the most recent successful connect anywhere.

const STORAGE_PREFIX = 'stratos.endpoint.username.';
const LAST_USERNAME_KEY = `${STORAGE_PREFIX}__last`;

export function rememberedUsernameKey(endpointGuid: string): string {
  return `${STORAGE_PREFIX}${endpointGuid}`;
}

export function rememberUsername(endpointGuid: string, username: string): void {
  if (!username) return;
  try {
    window.localStorage?.setItem(rememberedUsernameKey(endpointGuid), username);
    window.localStorage?.setItem(LAST_USERNAME_KEY, username);
  } catch {
    // Private mode / quota — silent fail, prefill simply won't work.
  }
}

export function getRememberedUsername(endpointGuid: string): string | null {
  try {
    // Treat both null and empty-string as "no value". Some localStorage
    // shims (happy-dom variants) return '' for missing keys instead of
    // null, so a `??`-only fallback would incorrectly settle on ''.
    const perEndpoint = window.localStorage?.getItem(rememberedUsernameKey(endpointGuid));
    if (perEndpoint) return perEndpoint;
    const last = window.localStorage?.getItem(LAST_USERNAME_KEY);
    if (last) return last;
    return null;
  } catch {
    return null;
  }
}

export function forgetRememberedUsername(endpointGuid: string): void {
  try {
    window.localStorage?.removeItem(rememberedUsernameKey(endpointGuid));
    // Intentionally NOT clearing LAST_USERNAME_KEY here — disconnecting
    // from one endpoint shouldn't blank the prefill for unrelated ones.
  } catch {
    // ignore
  }
}
