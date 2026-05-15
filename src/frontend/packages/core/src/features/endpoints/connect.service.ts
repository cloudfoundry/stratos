import { Injector } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import {
  entityCatalog,
  EndpointModel,
  EndpointsDataService,
  EndpointType,
  ActionState,
} from '@stratosui/store';

export interface ConnectAuthParams {
  username?: string;
  password?: string;
  token?: string;
}
import { combineLatest, defer, from, Observable, of, Subject, Subscription, timer } from 'rxjs';
import { delay, distinctUntilChanged, filter, map, pairwise, startWith, switchMap, tap } from 'rxjs/operators';

import { EndpointsService } from '../../core/endpoints.service';
import { safeUnsubscribe } from '../../core/utils.service';

export interface ConnectEndpointConfig {
  name: string;
  guid: string;
  type: EndpointType;
  subType: string;
  ssoAllowed: boolean;
}

export interface ConnectEndpointData {
  authType: string;
  authVal: ConnectAuthParams;
  systemShared: boolean;
  bodyContent: string;
}

// Why is this here instead of somewhere more common? Answer - Because it'd create circulate dependencies due to reliance on entityCatalog
export const isEndpointConnected = (endpoint: EndpointModel): boolean => {
  const epType = entityCatalog.getEndpoint(endpoint.cnsi_type, endpoint.sub_type).definition;
  return endpoint.connectionStatus === 'connected' || epType.unConnectable;
};

export class ConnectEndpointService {

  public connectingError$!: Observable<string | null>;
  private hasConnected = new Subject<boolean>();

  // This Observable is used to observe when conenction has completed
  public hasConnected$: Observable<boolean> = this.hasConnected.asObservable();
  public isBusy$!: Observable<boolean>;

  private connecting$!: Observable<boolean>;
  private connected$!: Observable<[boolean, EndpointModel]>;
  private fetchingInfo$!: Observable<boolean>;
  private update$!: Observable<ActionState>;

  private subs: Subscription[] = [];

  private hasAttemptedConnect!: boolean;
  private pData!: ConnectEndpointData;

  // We need a delay to ensure the BE has finished registering the endpoint.
  // If we don't do this and if we're quick enough, we can navigate to the application page
  // and end up with an empty list where we should have results.
  private connectDelay = 1000;

  // W36-B Wave 3: optional Wave-1 signal-native EndpointsDataService.
  // When provided, all monitor/dispatcher reads route through the
  // service's per-guid signals (`connectingState`, `fetchingState`,
  // `endpointById`) and `connect()` Promise. When omitted (legacy
  // construction sites that haven't been threaded yet), the service
  // throws if `submit()` is invoked — see the dispatcher migration
  // notes for callsites that must inject this.
  constructor(
    private endpointsService: EndpointsService,
    public config: ConnectEndpointConfig,
    private endpointsData: EndpointsDataService,
    private injector: Injector,
  ) {
    this.setupObservables();
    this.setupSubscriptions();
  }

  private setupSubscriptions() {
    // Mirror the legacy "fetched the endpoint after connect lifecycle
    // resolved" hook. With the signal-native service the canonical
    // refresh happens inside connect()'s success branch (it calls
    // service.getAll()), so this just observes update$ for the busy→idle
    // transition to keep the existing pairwise contract for downstream
    // consumers; no extra HTTP call is fired.
    this.subs.push(this.update$.pipe(
      pairwise()
    ).subscribe(([oldVal, newVal]) => {
      if (!newVal.error && (oldVal.busy && !newVal.busy)) {
        // Service.connect already triggers a getAll(false) refresh on
        // success — no separate per-guid GET dispatch needed.
      }
    }));

    this.subs.push(this.connected$.pipe(
      filter(([isConnected]) => isConnected),
      delay(this.connectDelay),
      tap(() => this.hasConnected.next(true)),
      distinctUntilChanged(([isConnected], [oldIsConnected]) => isConnected && oldIsConnected),
    ).subscribe(([, endpoint]) => this.endpointsService.checkEndpoint(endpoint))
    );
  }

  private setupObservables() {
    // W36-B Wave 3: replace ngrx EntityMonitor reads with toObservable()
    // bridges over EndpointsDataService signals. The service already
    // exposes `connectingState(guid)` / `fetchingState(guid)` /
    // `endpointById(guid)` per the Wave 1 surface lock; we just lift
    // them into the Observable shape this rxjs-heavy class expects.
    const connectingState$ = toObservable(
      this.endpointsData.connectingState(this.config.guid),
      { injector: this.injector },
    );
    const fetchingState$ = toObservable(
      this.endpointsData.fetchingState(this.config.guid),
      { injector: this.injector },
    );
    const endpoint$ = toObservable(
      this.endpointsData.endpointById(this.config.guid),
      { injector: this.injector },
    );

    // update$ is the per-guid connecting lifecycle (replaces legacy
    // `getUpdatingSection(ConnectEndpoint.UpdatingKey)`). Initial
    // signal value is the default ActionState so downstream pairwise()
    // still gets a real first emission to seed against.
    this.update$ = connectingState$;

    this.fetchingInfo$ = fetchingState$.pipe(
      map(state => state.fetching),
    );

    this.connected$ = endpoint$.pipe(
      map(endpoint => {
        const isConnected = !!(endpoint && endpoint.api_endpoint && endpoint.user);
        return [isConnected, endpoint as EndpointModel] as [boolean, EndpointModel];
      })
    );
    const busy$ = this.update$.pipe(map(update => update.busy), startWith(false));
    this.connecting$ = busy$.pipe(
      pairwise(),
      switchMap(([oldBusy, newBusy]) => {
        if (oldBusy === true && newBusy === false) {
          // The inner observable covers the UI after the connect request
          // resolves. Use a timer instead of re-subscribing to busy$ so a
          // failed connect (which never emits a fresh busy=false on the
          // monitor) still flips connecting$ back to false after the
          // delay — the previous "busy$.pipe(delay, startWith(true))"
          // form relied on busy$ emitting inside the window, which
          // doesn't happen on the error branch and left both Cancel and
          // Connect disabled indefinitely.
          return timer(this.connectDelay).pipe(
            map(() => false),
            startWith(true),
          );
        }
        return of(newBusy);
      })
    );
    this.connectingError$ = this.update$.pipe(
      filter(() => this.hasAttemptedConnect),
      map(update => update.error ? update.message || 'Could not connect to the endpoint' : null)
    );

    this.setupCombinedObservables();
  }

  private setupCombinedObservables() {
    this.isBusy$ = combineLatest(
      this.connecting$.pipe(startWith(false)),
      this.fetchingInfo$.pipe(startWith(false))
    ).pipe(
      map(([connecting, fetchingInfo]) => connecting || fetchingInfo),
    );
  }

  public setData(data: ConnectEndpointData) {
    this.pData = data;
  }

  public submit(): Observable<{ success: boolean, errorMessage: string }> {
    this.hasAttemptedConnect = true;
    const { authType, authVal, systemShared } = this.pData;
    // bodyContent is intentionally unused — see body: null comment below.
    // W36-B Wave 3: dispatch via EndpointsDataService.connect, which
    // owns the HTTP call + lifecycle and resolves to a single
    // ActionState. The legacy pairwise+filter shape over
    // `endpoint.api.connect` watched the ngrx busy→idle transition for
    // the same final value; with Promise<ActionState> we just lift it
    // into an Observable for the consumer signature.
    //
    // `defer` ensures the connect call only fires when the consumer
    // subscribes (matching the lazy semantics of the legacy
    // `endpoint.api.connect` returning an Observable that didn't fire
    // until subscribed).
    return defer(() =>
      from(
        this.endpointsData.connect(this.config.guid, {
          endpointType: this.config.type,
          authType,
          authValues: authVal as unknown as Record<string, string>,
          systemShared,
          // Legacy ConnectEndpoint action carried `body: string` but the
          // effect only merged it in when it was a FormData instance —
          // every callsite today passes either '' or a string from
          // endpointFormInstance.getBody(), so the field is effectively
          // unused on the wire. Wave 3 keeps that semantics by passing
          // null; if a future caller needs custom body content, surface
          // FormData up to ConnectEndpointData explicitly.
          body: null,
        }),
      ),
    ).pipe(
      map(actionState => ({
        success: !actionState.error,
        errorMessage: actionState.message,
      })),
    );
  }

  public destroy() {
    safeUnsubscribe(...this.subs);
  }
}
