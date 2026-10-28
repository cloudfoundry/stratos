import { effect, Injector, Signal, untracked } from '@angular/core';
import {
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
import { combineLatest, defer, from, Observable, of, ReplaySubject, Subject, Subscription, timer } from 'rxjs';
import { delay, filter, finalize, map, pairwise, shareReplay, startWith, switchMap, take, tap } from 'rxjs/operators';

import { EndpointsService } from '../../core/endpoints.service';
import { safeUnsubscribe } from '../../core/utils.service';
import { TailwindSnackBarService } from '../../shared/services/tailwind-snackbar.service';
import { rememberUsername } from './remembered-username';

export interface ConnectEndpointConfig {
  name: string;
  guid: string;
  type: EndpointType;
  subType: string;
  ssoAllowed: boolean;
  // The currently-connected username, when the dialog opens against an
  // already-connected endpoint (Reconnect). Preferred over the
  // localStorage-remembered username, which only covers past connects
  // from this browser profile.
  username?: string;
}

export interface ConnectEndpointData {
  authType: string;
  authVal: ConnectAuthParams;
  systemShared: boolean;
  bodyContent: string;
}

export class ConnectEndpointService {

  public connectingError$!: Observable<string | null>;
  private hasConnected = new Subject<boolean>();
  // Each tokens call that succeeded
  private connectSucceeded = new Subject<void>();

  // Emits when a connect has completed: true when this service has already
  // told the user (its "Connected to …" offer), so the caller need not.
  public hasConnected$: Observable<boolean> = this.hasConnected.asObservable();
  private reportedConnect = false;
  public isBusy$!: Observable<boolean>;

  private connecting$!: Observable<boolean>;
  private connected$!: Observable<[boolean, EndpointModel]>;
  private fetchingInfo$!: Observable<boolean>;
  private update$!: Observable<ActionState>;

  private subs: Subscription[] = [];
  // Ends the signal bridges made by observe(); see there.
  private bridgeTeardowns: (() => void)[] = [];

  private hasAttemptedConnect!: boolean;
  private inFlight?: Observable<{ success: boolean, errorMessage: string }>;
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

    // Report a connect only once the tokens call succeeded. An endpoint
    // being Reconnected is connected throughout, so watching it for a
    // user read any refresh of the endpoint list during a failed attempt
    // as success, and the dialog closed with no error shown.
    this.subs.push(this.connectSucceeded.pipe(
      switchMap(() => this.connected$.pipe(filter(([isConnected]) => isConnected), take(1))),
      delay(this.connectDelay),
      tap(() => this.hasConnected.next(this.reportedConnect)),
    ).subscribe(([, endpoint]) => this.endpointsService.checkEndpoint(endpoint))
    );
  }

  private setupObservables() {
    // W36-B Wave 3: replace ngrx EntityMonitor reads with observe()
    // bridges over EndpointsDataService signals. The service already
    // exposes `connectingState(guid)` / `fetchingState(guid)` /
    // `endpointById(guid)` per the Wave 1 surface lock; we just lift
    // them into the Observable shape this rxjs-heavy class expects.
    const connectingState$ = this.observe(this.endpointsData.connectingState(this.config.guid));
    const fetchingState$ = this.observe(this.endpointsData.fetchingState(this.config.guid));
    const endpoint$ = this.observe(this.endpointsData.endpointById(this.config.guid));

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

  // toObservable() with this connect's lifetime. toObservable() ends its
  // effect only when the injector is destroyed, and the caller's injector
  // (the page or stepper) outlives each connect, so every connect left
  // three effects running. Same values and timing: one effect per signal,
  // created now, latest value replayed to later subscribers.
  private observe<T>(source: Signal<T>): Observable<T> {
    const subject = new ReplaySubject<T>(1);
    const ref = effect(() => {
      const value = source();
      untracked(() => subject.next(value));
    }, { injector: this.injector, manualCleanup: true });
    this.bridgeTeardowns.push(() => {
      ref.destroy();
      subject.complete();
    });
    return subject.asObservable();
  }

  private setupCombinedObservables() {
    this.isBusy$ = combineLatest([
      this.connecting$.pipe(startWith(false)),
      this.fetchingInfo$.pipe(startWith(false))
    ]).pipe(
      map(([connecting, fetchingInfo]) => connecting || fetchingInfo),
    );
  }

  public setData(data: ConnectEndpointData) {
    this.pData = data;
  }

  public submit(): Observable<{ success: boolean, errorMessage: string }> {
    // One connect at a time: a submit while one runs (Enter pressed again,
    // or Enter after the Connect button) shares it instead of starting
    // another.
    return defer(() => {
      if (!this.inFlight) {
        this.inFlight = this.connect().pipe(
          take(1),
          finalize(() => this.inFlight = undefined),
          shareReplay({ bufferSize: 1, refCount: false }),
        );
      }
      return this.inFlight;
    });
  }

  // The user is also connected, at the same address, to endpoints of this
  // type that the backend paired with this one (a personal endpoint is
  // involved). Every connection stays unless the user asks; dismissing
  // keeps them all. The message reports the connect too: one connect, one
  // message.
  private offerDisconnect(others: { guid: string, name: string }[]) {
    const snackBar = this.injector.get(TailwindSnackBarService);
    const names = others.map(other => `'${other.name}'`).join(', ');
    snackBar.show(`Connected to '${this.config.name}'. You are also connected to this address through ${names}. ` +
      'Dismiss to keep all connected.', 'Disconnect others')
      .onAction().pipe(take(1)).subscribe(() => others.forEach(other =>
        this.endpointsData.disconnect(other.guid).then(state => {
          if (state.error) {
            snackBar.show(`Could not disconnect '${other.name}': ${state.message}`, 'Dismiss');
          }
        })));
  }

  private connect(): Observable<{ success: boolean, errorMessage: string }> {
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
      map(actionState => {
        if (!actionState.error) {
          // Cache the username so the next reconnect dialog (which sees an
          // endpoint.user cleared by disconnect) can prefill it. Only for
          // credentials-style auth — SSO / token forms don't carry one.
          const username = (authVal as { username?: string })?.username;
          if (username) {
            rememberUsername(this.config.guid, username);
          }
          this.reportedConnect = !!actionState.alsoConnected?.length;
          this.connectSucceeded.next();
          if (actionState.alsoConnected?.length) {
            this.offerDisconnect(actionState.alsoConnected);
          }
        }
        return {
          success: !actionState.error,
          errorMessage: actionState.message,
        };
      }),
    );
  }

  public destroy() {
    safeUnsubscribe(...this.subs);
    this.bridgeTeardowns.forEach(teardown => teardown());
    this.bridgeTeardowns = [];
  }
}
