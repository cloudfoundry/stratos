import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { EndpointType } from '../extension-types';
import { httpErrorResponseToSafeString } from '../jetstream';
import { ActionState, getDefaultActionState } from '../reducers/api-request-reducer/types';
import { EndpointModel } from '../types/endpoint.types';
import { SystemInfo } from '../types/system.types';

/**
 * Wave-1 (W36-B) signal-native endpoints data service.
 *
 * Replaces — over Waves 2 through 5 — the legacy
 * `state.requestData.stratosEndpoint` slice + `endpoint.effects.ts` +
 * `endpoint.actions.ts` + `endpoint.selectors.ts` triumvirate.
 *
 * Wave 1 stands up the FULL public surface so subsequent waves can lock
 * against it without further churn:
 *   - Wave 2 migrates store-selector consumers to `endpoints` /
 *     `endpointById` / `endpointsByType` / `connected` signals.
 *   - Wave 3 migrates `stratosEntityCatalog.endpoint.api.*` dispatchers
 *     and `getEntityMonitor` / `getUpdatingSection` consumers to the
 *     async methods + per-guid lifecycle signals here.
 *   - Wave 4 wires cleanup orchestration to `disconnectedSignal`.
 *   - Wave 5 retires the legacy slice + auth.effects EndpointsSuccess$.
 *
 * Architectural notes:
 *   - Service does NOT dispatch wrapper actions
 *     (StartRequestAction / WrapperRequestActionSuccess etc). It owns
 *     lifecycle internally via per-guid signals. Legacy effects still
 *     fire from legacy dispatchers during the transition; both paths
 *     run in parallel until Wave 5 deletes the old one.
 *   - Service owns its own /pp/v1/info HTTP call. During Waves 1-4 the
 *     legacy `system.effects.ts` GET path also runs; two HTTP calls per
 *     hydration is intentional and gets cleaned up in Wave 5.
 *   - `getAll(login)` carries the `login` flag for Wave 5's auth wire
 *     (verifyAuth$ -> service.getAll(true) -> LoginSuccess). Wave 1
 *     stores it as a last-call flag only.
 */

const SYSTEM_INFO_URL = '/pp/v1/info';
const TOKENS_URL = '/api/v1/tokens';
const ENDPOINTS_URL = '/api/v1/endpoints';

export interface EndpointFetchingState {
  fetching: boolean;
  error?: string;
  message?: string;
}

export interface EndpointDisconnectEvent {
  guid: string;
  type: EndpointType;
  name: string;
}

/**
 * Wave 4 part 1 (W36-B) — connect-event delta surface.
 *
 * Mirrors {@link EndpointDisconnectEvent}: the service emits one event per
 * successful connect mutation, and Wave 4's cleanup orchestration drains
 * the queue via {@link EndpointsDataService.clearConnected}. Used to drive
 * post-connect side-effects that legacy listeners hung off
 * `CONNECT_ENDPOINTS_SUCCESS` (per-endpoint user-roles fetch + per-endpoint
 * internal-event log clear).
 */
export interface EndpointConnectEvent {
  guid: string;
  type: EndpointType;
  name: string;
  /**
   * Endpoint sub-type tag (e.g. `helm-hub` for HELM endpoints). Optional
   * because not every endpoint type has sub-types; consumers should
   * fall back to `undefined`.
   */
  subType?: string;
  /** User the endpoint is now connected as — required by `userRolesFetch`. */
  user: EndpointModel['user'];
}

export interface EndpointConnectOptions {
  endpointType: EndpointType;
  authType: string;
  authValues: Record<string, string>;
  systemShared: boolean;
  body?: FormData | null;
}

export interface EndpointRegisterOptions {
  endpointType: EndpointType;
  endpointSubType?: string | null;
  name: string;
  endpoint: string;
  skipSslValidation: boolean;
  clientID?: string;
  clientSecret?: string;
  ssoAllowed: boolean;
  createSystemEndpoint: boolean;
  caCert?: string;
}

export interface EndpointUpdateOptions {
  endpointType: EndpointType;
  name: string;
  skipSSL: boolean;
  setClientInfo: boolean;
  clientID?: string;
  clientSecret?: string;
  allowSSO: boolean;
  caCert?: string;
}

const EMPTY_FETCH_STATE: EndpointFetchingState = { fetching: false };

@Injectable({ providedIn: 'root' })
export class EndpointsDataService {
  private http = inject(HttpClient);

  // ---- core state ---------------------------------------------------------

  /** Endpoints keyed by GUID. Empty until first `getAll()` resolves. */
  private readonly _endpoints = signal<Map<string, EndpointModel>>(new Map());

  /** Aggregate request state — replaces `endpointStatusSelector`. */
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  /** Per-guid fetch lifecycle — replaces `entityRequest$` / `waitForEntity$`. */
  private readonly _fetchingStates = signal<Map<string, EndpointFetchingState>>(new Map());

  /** Per-guid connect lifecycle — replaces `getUpdatingSection(ConnectEndpoint.UpdatingKey)`. */
  private readonly _connectingStates = signal<Map<string, ActionState>>(new Map());

  /** Per-guid disconnect lifecycle — replaces `getUpdatingSection(DisconnectEndpoint.UpdatingKey)`. */
  private readonly _disconnectingStates = signal<Map<string, ActionState>>(new Map());

  /** Delta queue of disconnects, consumed by Wave 4 cleanup orchestration. */
  private readonly _disconnected = signal<EndpointDisconnectEvent[]>([]);

  /** Delta queue of connects, consumed by Wave 4 cleanup orchestration. */
  private readonly _connected = signal<EndpointConnectEvent[]>([]);

  // Wave 5 will read this. Wave 1 records it but does not act on it.
  private lastGetAllLogin = false;
  private hydrationPromise: Promise<EndpointModel[]> | null = null;
  private hydrated = false;
  private readyResolvers: Array<() => void> = [];

  // ---- public signal surface ---------------------------------------------

  readonly endpoints: Signal<Map<string, EndpointModel>> = this._endpoints.asReadonly();

  readonly endpointsList: Signal<EndpointModel[]> = computed(() =>
    Array.from(this._endpoints().values())
  );

  readonly loading: Signal<boolean> = this._loading.asReadonly();
  readonly error: Signal<string | null> = this._error.asReadonly();

  /** Delta-list of recent disconnects. Consumers read + clear via {@link clearDisconnected}. */
  readonly disconnectedSignal: Signal<EndpointDisconnectEvent[]> = this._disconnected.asReadonly();

  /** Delta-list of recent successful connects. Consumers read + clear via {@link clearConnected}. */
  readonly connectedSignal: Signal<EndpointConnectEvent[]> = this._connected.asReadonly();

  endpointById(guid: string): Signal<EndpointModel | null> {
    return computed(() => this._endpoints().get(guid) ?? null);
  }

  endpointsByType(type: EndpointType): Signal<EndpointModel[]> {
    return computed(() =>
      Array.from(this._endpoints().values()).filter(e => e.cnsi_type === type)
    );
  }

  connected(type?: EndpointType): Signal<EndpointModel[]> {
    return computed(() =>
      Array.from(this._endpoints().values()).filter(e => {
        if (type && e.cnsi_type !== type) {
          return false;
        }
        return e.connectionStatus === 'connected';
      })
    );
  }

  fetchingState(guid: string): Signal<EndpointFetchingState> {
    return computed(() => this._fetchingStates().get(guid) ?? EMPTY_FETCH_STATE);
  }

  connectingState(guid: string): Signal<ActionState> {
    return computed(() => this._connectingStates().get(guid) ?? getDefaultActionState());
  }

  disconnectingState(guid: string): Signal<ActionState> {
    return computed(() => this._disconnectingStates().get(guid) ?? getDefaultActionState());
  }

  // ---- readiness primitive (used by pipeline) ----------------------------

  /**
   * Resolves once the first `getAll()` has populated the endpoints map
   * (or failed). Pipeline callers awaiting `whenReady()` will block
   * exactly long enough for the SESSION_VERIFIED -> getAll cycle to
   * complete before they read `endpoints()`.
   *
   * Calling `whenReady()` BEFORE `getAll()` triggers an implicit hydration
   * so the signal is populated by the time the promise resolves. This
   * matches the legacy `take(1)` semantic of `store.select(...)`: callers
   * never had to coordinate the initial fetch themselves.
   */
  whenReady(): Promise<void> {
    if (this.hydrated) {
      return Promise.resolve();
    }
    if (!this.hydrationPromise) {
      // Implicit hydration — same /pp/v1/info call legacy effects make.
      // No-op on the existing legacy path; just adds a parallel fetcher
      // that owns this service's signal updates.
      void this.getAll(false).catch(() => {/* errors already on _error */});
    }
    return new Promise<void>(resolve => {
      this.readyResolvers.push(resolve);
    });
  }

  // ---- mutation methods ---------------------------------------------------

  async getAll(login = false): Promise<EndpointModel[]> {
    this.lastGetAllLogin = login;
    if (this.hydrationPromise) {
      return this.hydrationPromise;
    }
    this._loading.set(true);
    this._error.set(null);
    this.hydrationPromise = (async () => {
      try {
        const info = await firstValueFrom(this.http.get<SystemInfo>(SYSTEM_INFO_URL));
        const next = new Map<string, EndpointModel>();
        const payload = info?.endpoints ?? {};
        Object.keys(payload).forEach(type => {
          const endpointsForType = payload[type] ?? {};
          Object.values(endpointsForType).forEach(endpointInfo => {
            const merged: EndpointModel = {
              ...endpointInfo,
              connectionStatus: endpointInfo.user ? 'connected' : 'disconnected',
            };
            next.set(merged.guid, merged);
          });
        });
        this._endpoints.set(next);
        this._loading.set(false);
        this.markHydrated();
        return Array.from(next.values());
      } catch (err) {
        this._loading.set(false);
        this._error.set(this.fetchError(err) || 'Failed to get endpoints');
        this.markHydrated();
        throw err;
      } finally {
        this.hydrationPromise = null;
      }
    })();
    return this.hydrationPromise;
  }

  async waitFor(guid: string): Promise<EndpointModel> {
    const existing = this._endpoints().get(guid);
    if (existing) {
      return existing;
    }
    await this.whenReady();
    const after = this._endpoints().get(guid);
    if (after) {
      return after;
    }
    throw new Error(`Endpoint ${guid} not found`);
  }

  async register(opts: EndpointRegisterOptions): Promise<ActionState & { guid?: string }> {
    const body = new FormData();
    body.set('endpoint_type', opts.endpointType);
    body.set('cnsi_name', opts.name);
    body.set('api_endpoint', opts.endpoint);
    body.set('skip_ssl_validation', opts.skipSslValidation ? 'true' : 'false');
    body.set('cnsi_client_id', opts.clientID || '');
    body.set('cnsi_client_secret', opts.clientSecret || '');
    body.set('sso_allowed', opts.ssoAllowed ? 'true' : 'false');
    body.set('create_system_endpoint', opts.createSystemEndpoint ? 'true' : 'false');
    body.set('ca_cert', opts.caCert || '');
    if (opts.endpointSubType) {
      body.set('sub_type', opts.endpointSubType);
    }

    const stagingGuid = '<New Endpoint>' + opts.name;
    return this.runMutation(stagingGuid, 'POST', ENDPOINTS_URL, body, e => {
      const message = 'There was a problem creating the endpoint. Please ensure the endpoint address is correct and try again. ' +
        httpErrorResponseToSafeString(e);
      if (e?.status === 403) {
        return `${e?.error?.error}. Please check "Skip SSL validation for the endpoint" if the certificate issuer is trusted`;
      }
      return message;
    }, async endpoint => {
      // Refresh full endpoint set so the new entry shows up keyed by real guid.
      await this.getAll(false).catch(() => {/* surfaced on _error */});
      return endpoint;
    });
  }

  async connect(guid: string, opts: EndpointConnectOptions): Promise<ActionState> {
    if (opts.authType === 'sso') {
      // Special-case SSO — redirect kicks the browser away; nothing to await.
      const loc = window.location.protocol + '//' + window.location.hostname +
        (window.location.port ? ':' + window.location.port : '');
      const ssoUrl = `${TOKENS_URL}?guid=${guid}&state=${encodeURIComponent(loc)}`;
      window.location.assign(ssoUrl);
      return getDefaultActionState();
    }

    const body = new FormData();
    body.set('cnsi_guid', guid);
    body.set('connect_type', opts.authType);
    body.set('system_shared', String(opts.systemShared));
    Object.keys(opts.authValues).forEach(key => {
      body.set(key, (opts.authValues as Record<string, string>)[key]);
    });
    if (opts.body && opts.body instanceof FormData) {
      opts.body.forEach((value, key) => body.set(key, value));
    }

    this.markConnecting(guid, true);
    return this.runMutation(guid, 'POST', TOKENS_URL, body, e =>
      httpErrorResponseToSafeString(e) || 'Could not connect, please try again',
    ).then(async state => {
      this.markConnecting(guid, false, state);
      if (!state.error) {
        // Refresh authoritative state so connectionStatus + user fields land.
        // Await so the emitted ConnectEvent reflects post-refresh user data
        // (Wave 4 cleanup orchestration needs `user` to drive userRolesFetch).
        await this.getAll(false).catch(() => {/* surfaced on _error */});
        const after = this._endpoints().get(guid);
        if (after) {
          this.emitConnect({
            guid,
            type: after.cnsi_type,
            name: after.name,
            subType: after.sub_type,
            user: after.user,
          });
        }
      }
      return state;
    });
  }

  async disconnect(guid: string): Promise<ActionState> {
    const before = this._endpoints().get(guid);
    this.markDisconnecting(guid, true);
    return this.runMutation(guid, 'DELETE', `${TOKENS_URL}/${guid}`, null, () =>
      'Could not disconnect',
    ).then(state => {
      this.markDisconnecting(guid, false, state);
      if (!state.error) {
        // Mark local copy disconnected immediately; getAll() refresh follows.
        const next = new Map(this._endpoints());
        const cur = next.get(guid);
        if (cur) {
          next.set(guid, { ...cur, connectionStatus: 'disconnected', user: null as unknown as EndpointModel['user'] });
          this._endpoints.set(next);
        }
        if (before) {
          this.emitDisconnect({ guid, type: before.cnsi_type, name: before.name });
        }
      }
      return state;
    });
  }

  async unregister(guid: string): Promise<ActionState> {
    const before = this._endpoints().get(guid);
    return this.runMutation(guid, 'DELETE', `${ENDPOINTS_URL}/${guid}`, null, () =>
      'Could not unregister endpoint',
    ).then(state => {
      if (!state.error) {
        const next = new Map(this._endpoints());
        next.delete(guid);
        this._endpoints.set(next);
        if (before) {
          this.emitDisconnect({ guid, type: before.cnsi_type, name: before.name });
        }
      }
      return state;
    });
  }

  async update(guid: string, opts: EndpointUpdateOptions): Promise<ActionState> {
    const body = new FormData();
    body.set('name', opts.name);
    body.set('skipSSL', String(opts.skipSSL));
    body.set('setClientInfo', String(opts.setClientInfo));
    body.set('clientID', opts.clientID || '');
    body.set('clientSecret', opts.clientSecret || '');
    body.set('allowSSO', String(opts.allowSSO));
    body.set('ca_cert', opts.caCert || '');

    return this.runMutation(guid, 'POST', `${ENDPOINTS_URL}/${guid}`, body, e => {
      const message = 'There was a problem updating the endpoint. ' + httpErrorResponseToSafeString(e);
      if (e?.status === 403) {
        return `${message}. Please check "Skip SSL validation for the endpoint" if the certificate issuer is trusted`;
      }
      return message;
    }, async () => {
      await this.getAll(false).catch(() => {/* surfaced on _error */});
    });
  }

  // ---- delta-queue helpers (Wave 4 consumer) -----------------------------

  clearDisconnected(): void {
    this._disconnected.set([]);
  }

  clearConnected(): void {
    this._connected.set([]);
  }

  // ---- internals ---------------------------------------------------------

  /** True iff the last `getAll()` was triggered as part of the login flow. */
  wasLoginCall(): boolean {
    return this.lastGetAllLogin;
  }

  private markHydrated(): void {
    this.hydrated = true;
    const resolvers = this.readyResolvers;
    this.readyResolvers = [];
    resolvers.forEach(r => r());
  }

  private markConnecting(guid: string, busy: boolean, finalState?: ActionState): void {
    const next = new Map(this._connectingStates());
    if (busy) {
      next.set(guid, { busy: true, error: false, message: '' });
    } else if (finalState) {
      next.set(guid, finalState);
    } else {
      next.set(guid, getDefaultActionState());
    }
    this._connectingStates.set(next);
  }

  private markDisconnecting(guid: string, busy: boolean, finalState?: ActionState): void {
    const next = new Map(this._disconnectingStates());
    if (busy) {
      next.set(guid, { busy: true, error: false, message: '' });
    } else if (finalState) {
      next.set(guid, finalState);
    } else {
      next.set(guid, getDefaultActionState());
    }
    this._disconnectingStates.set(next);
  }

  private markFetching(guid: string, fetching: boolean, error?: string): void {
    const next = new Map(this._fetchingStates());
    if (fetching) {
      next.set(guid, { fetching: true });
    } else {
      next.set(guid, { fetching: false, error, message: error });
    }
    this._fetchingStates.set(next);
  }

  private emitDisconnect(event: EndpointDisconnectEvent): void {
    this._disconnected.set([...this._disconnected(), event]);
  }

  private emitConnect(event: EndpointConnectEvent): void {
    this._connected.set([...this._connected(), event]);
  }

  private async runMutation(
    guid: string,
    method: string,
    url: string,
    body: FormData | null,
    errorMessageHandler: (e: HttpErrorResponse) => string,
    onSuccess?: (endpoint: EndpointModel) => Promise<EndpointModel | void> | void,
  ): Promise<ActionState & { guid?: string }> {
    this.markFetching(guid, true);
    try {
      const params = new HttpParams();
      const result = await firstValueFrom(
        this.http.request<EndpointModel>(method, url, {
          params,
          body: body || {},
        })
      );
      if (onSuccess) {
        await onSuccess(result);
      }
      this.markFetching(guid, false);
      // Surface the response's authoritative guid alongside the
      // ActionState. For register() this is the freshly-assigned guid
      // (the input `guid` is a synthetic staging key) — callers like
      // the connect stepper depend on it to wire the next step. For
      // connect / disconnect / unregister the guid is already known
      // by the caller, but always returning it keeps the contract
      // symmetric.
      return { busy: false, error: false, message: '', guid: result?.guid ?? guid };
    } catch (err) {
      const message = errorMessageHandler(err as HttpErrorResponse);
      this.markFetching(guid, false, message);
      return { busy: false, error: true, message };
    }
  }

  private fetchError(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      return httpErrorResponseToSafeString(err) || '';
    }
    return '';
  }
}
