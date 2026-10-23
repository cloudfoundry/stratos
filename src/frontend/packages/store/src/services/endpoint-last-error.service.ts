import { Injectable, computed, inject, linkedSignal } from '@angular/core';

import { AuthDataService } from './auth-data.service';

const STORAGE_PREFIX = 'stratos.endpoint.last-connect-error.';

type LastErrors = Record<string, string>;

/**
 * The text the endpoints page shows for an endpoint whose last connect
 * failed. Worded as the last error so it cannot read as the endpoint's
 * current state, which only a new connect tells.
 */
export function describeLastConnectError(message: string): string {
  return `The last error was ${message.replace(/\.+$/, '')}. Reconnect to get the latest status.`;
}

/**
 * Why each endpoint's last connect failed, for the signed-in user.
 *
 * A failed connect stores no token, so after a page reload the endpoint
 * reads Disconnected with no sign of what went wrong. The reason is kept in
 * browser storage, per user and endpoint (one key per user), until a connect
 * succeeds or the endpoint is unregistered. Storage that refuses access
 * (private mode, quota) leaves it in memory for the session.
 */
@Injectable({ providedIn: 'root' })
export class EndpointLastErrorService {
  private auth = inject(AuthDataService);

  private readonly storageKey = computed(() => {
    const userGuid = this.auth.sessionData()?.user?.guid;
    return userGuid ? STORAGE_PREFIX + userGuid : null;
  });

  // Reloaded from storage whenever the signed-in user changes.
  private readonly errors = linkedSignal<string | null, LastErrors>({
    source: this.storageKey,
    computation: key => readErrors(key),
  });

  lastError(endpointGuid: string): string | null {
    return this.errors()[endpointGuid] ?? null;
  }

  record(endpointGuid: string, message: string): void {
    this.save({ ...this.errors(), [endpointGuid]: message });
  }

  clear(endpointGuid: string): void {
    if (endpointGuid in this.errors()) {
      const rest = { ...this.errors() };
      delete rest[endpointGuid];
      this.save(rest);
    }
  }

  private save(errors: LastErrors): void {
    this.errors.set(errors);
    const key = this.storageKey();
    if (!key) {
      return;
    }
    try {
      if (Object.keys(errors).length) {
        localStorage.setItem(key, JSON.stringify(errors));
      } else {
        localStorage.removeItem(key);
      }
    } catch {
      // Storage refused: the errors stay in memory for this session.
    }
  }
}

function readErrors(key: string | null): LastErrors {
  if (!key) {
    return {};
  }
  try {
    const stored = JSON.parse(localStorage.getItem(key) ?? '{}');
    return stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {};
  } catch {
    return {};
  }
}
