import { Injectable, signal, Injector, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Store } from '@ngrx/store';
import {
  StratosStatus, GeneralEntityAppState,
  EndpointModel, endpointEntityType, STRATOS_ENDPOINT_TYPE,
  selectEntity, entityCatalog,
} from '@stratosui/store';
import { toObservable } from '@angular/core/rxjs-interop';
import { combineLatest, Observable, ReplaySubject } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, publishReplay, refCount, startWith, take } from 'rxjs/operators';

export type GlobalEventTypes = 'warning' | 'error' | 'process' | 'complete';

export const endpointEventKey = 'endpointError';

/**
 * Used to build the message or link for an event
 * @export
 */
export class GlobalEventData<T = any> {
  constructor(public triggered = true, public data?: T) { }
}

interface IGlobalEventType {
  type?: GlobalEventTypes;
  subType?: string;
}

/**
 * An global application wide event that is derived from data stored in the store.
 *
 * @export
 * @template SelectedState The root data that the event can be generated from. Will act as the EventData if no EventData is provided.
 * @template EventState This data can be used to generate the link or message for an event.
 */
export interface IGlobalEventConfig<SelectedState, EventState = SelectedState> extends IGlobalEventType {

  /**
   * Can be used to generate the data for an event.
   * If an array is passed then multiple events will be created of the type provided in the config.
   */
  eventTriggered: (state: SelectedState | GeneralEntityAppState) => GlobalEventData | GlobalEventData[];
  message: ((data?: EventState, appState?: GeneralEntityAppState) => string) | string;
  key?: ((data?: EventState, appState?: GeneralEntityAppState) => string) | string;

  /**
   * Used to get the part of the store the event may be built from.
   */
  selector?: (state: GeneralEntityAppState) => SelectedState;
  link?: ((data?: EventState, appState?: GeneralEntityAppState) => string) | string;
}

export interface IGlobalEvent extends IGlobalEventType {
  message: string;
  link: string;
  key: string;
  stratosStatus?: StratosStatus;
  read?: boolean;
  // Optional structured fields used by signal-published endpoint errors
  // so the banner / events page can render endpoint identifier as a
  // title and the error detail as the body. Falls back to the flat
  // `message` field when these aren't populated (legacy ngrx events).
  endpointName?: string;
  endpointId?: string;
  detail?: string;
}
@Injectable({
  providedIn: 'root'
})
export class GlobalEventService {
  private eventConfigs: IGlobalEventConfig<any>[] = [];
  private eventConfigsSubject = new ReplaySubject<IGlobalEventConfig<any>[]>();

  private readonly eventTypePriority: GlobalEventTypes[] = [
    'process', 'error', 'warning', 'complete'
  ];

  private dataCache = new Map<any, Map<any, IGlobalEvent[]>>();

  private _readEvents = signal<Map<string, IGlobalEvent>>(new Map<string, IGlobalEvent>());
  public readEvents = this._readEvents.asReadonly();

  // Signal-native imperative event channel — wholesale-replaced on each
  // publishEndpointErrors() call. Sits alongside the ngrx-driven event
  // stream so signal-native callers (MergeOrchestrator-backed pages) can
  // surface endpoint errors through the same page-header banner without
  // round-tripping via ngrx state. Last-write-wins; per-source isolation
  // is intentionally not implemented because Stratos tears down the
  // previous page's signal-config service before mounting the next, so
  // only one orchestrator publishes at any one time.
  //
  // Persisted to sessionStorage so a refresh or direct nav to
  // /events/endpoints restores the last known endpoint-error events
  // without needing the publishing orchestrator to re-mount and refire.
  // Reads on construct (hydrate); writes on every publishEndpointErrors.
  // Cleared by storage-tab close, not by sign-out — ngrx-derived events
  // already clear with auth state.
  private _signalEvents = signal<IGlobalEvent[]>(loadPersistedSignalEvents());

  // Per-key static events published from signal-driven sources (e.g.
  // app.module's timeout-session / polling-disabled banners that used to
  // observe `state.dashboard.*` via ngrx). Each entry is keyed; setting
  // `null` removes that key. Merged into `events$` alongside the ngrx-
  // driven and `_signalEvents` channels.
  private _staticEvents = signal<ReadonlyMap<string, IGlobalEvent>>(new Map());

  public events$: Observable<IGlobalEvent[]>;
  public priorityType$: Observable<GlobalEventTypes>;
  public priorityStratosStatus$: Observable<StratosStatus>;

  public addEventConfig<SelectedState, EventState = SelectedState>(event: IGlobalEventConfig<SelectedState, EventState>) {
    this.eventConfigs.push(event);
    this.eventConfigsSubject.next(this.eventConfigs);
  }

  /**
   * Publish (or clear) a static global event keyed by `key`. Pass an
   * `event` to set it, `null` to remove it. Used by app.module to
   * surface signal-derived warnings (timeout-session disabled, polling
   * disabled) that previously read from the ngrx `state.dashboard`
   * slice.
   */
  public setStaticEvent(key: string, event: IGlobalEvent | null): void {
    this._staticEvents.update(current => {
      const next = new Map(current);
      if (event) {
        next.set(key, { ...event, key });
      } else {
        next.delete(key);
      }
      return next;
    });
  }

  /**
   * Publish endpoint-error events from signal-native callers. Each
   * entry's value is whatever the source's error() signal holds —
   * typically an HttpErrorResponse from an Angular HttpClient call.
   * Endpoint name is resolved from the ngrx endpoint store; CAPI body
   * detail is extracted when the error is an HttpErrorResponse with a
   * v3 `{errors:[{detail}]}` payload.
   *
   * Wholesale-replace: each call REPLACES the prior set. Pass an empty
   * map to clear all signal-published endpoint errors.
   */
  public publishEndpointErrors(errors: ReadonlyMap<string, unknown>): void {
    const events: IGlobalEvent[] = [];
    if (errors.size === 0) {
      this._signalEvents.set(events);
      persistSignalEvents(events);
      return;
    }
    this.store.pipe(take(1)).subscribe((appState: GeneralEntityAppState) => {
      const entityConfig = entityCatalog.getEntity(STRATOS_ENDPOINT_TYPE, endpointEntityType);
      for (const [cnsiGuid, err] of errors) {
        const endpoint = selectEntity<EndpointModel>(entityConfig.entityKey, cnsiGuid)(appState);
        const name = endpoint?.name ?? cnsiGuid;
        const detail = formatEndpointErrorDetail(err);
        events.push({
          key: `${endpointEventKey}-${cnsiGuid}`,
          // `message` kept as a flat string for legacy renderers; the
          // structured fields below let title/body templates render the
          // endpoint identifier prominently above the error detail.
          message: `${name} (${cnsiGuid}): ${detail}`,
          endpointName: name,
          endpointId: cnsiGuid,
          detail,
          // No link for signal-published events. The legacy /errors/:id
          // page accumulated per-endpoint error history from the ngrx
          // store and was useful when there were multiple historical
          // errors per endpoint. Signal-published errors only carry the
          // current latest error (no history), so the destination page
          // would render empty. Omitting `link` hides the View button
          // via the row template's `@if (event.link)` guard.
          link: '',
          type: 'error',
          stratosStatus: this.eventTypeToStratosStatus('error'),
        });
      }
      this._signalEvents.set(events);
      persistSignalEvents(events);
    });
  }

  public updateEventReadState(event: IGlobalEvent, read: boolean) {
    this._readEvents.update(events => {
      const newEvents = new Map(events);
      if (read && !newEvents.has(event.key)) {
        newEvents.set(event.key, event);
      } else if (!read && newEvents.has(event.key)) {
        newEvents.delete(event.key);
      }
      return newEvents;
    });
  }

  public filterEvents(eventType: GlobalEventTypes) {
    return this.events$.pipe(
      map(events => events.filter(event => event.type === eventType))
    );
  }

  public eventTypeToStratosStatus(eventType: GlobalEventTypes) {
    switch (eventType) {
      case ('warning'):
        return StratosStatus.WARNING;
      case ('process'):
        return StratosStatus.BUSY;
      case ('error'):
        return StratosStatus.ERROR;
      default:
        return null;
    }
  }

  // Get the event from the event config and event data.
  private getEvent(eventData: any, config: IGlobalEventConfig<any>, appState: GeneralEntityAppState): IGlobalEvent {
    const message = typeof config.message === 'function' ? config.message(eventData, appState) : config.message;
    const link = typeof config.link === 'function' ? config.link(eventData, appState) : config.link;
    const key = typeof config.key === 'function' ? config.key(eventData, appState) : config.key || config.message;
    const type = config.type || 'warning';
    return {
      message,
      link,
      key,
      type,
      stratosStatus: this.eventTypeToStratosStatus(type)
    } as IGlobalEvent;
  }

  // Get the events from the event config and event data.
  private getEvents(
    eventData: GlobalEventData | GlobalEventData[],
    selectedState: any,
    config: IGlobalEventConfig<any>,
    appState: GeneralEntityAppState
  ) {
    if (Array.isArray(eventData)) {
      if (eventData.length) {
        return eventData.map((data) => this.getEvent(data.data || selectedState, config, appState));
      }
    } else {
      return [this.getEvent(eventData.data || selectedState, config, appState)];
    }
  }

  // Will get the highest priority event type as dictated by eventTypePriority (0 index is highest priority)
  private getHighestPriorityEventType(eventTypes: IGlobalEventType[]): GlobalEventTypes {
    return eventTypes.reduce((currentPriority, nextType) => {
      if (
        currentPriority.priority !== 0 &&
        nextType.type &&
        nextType.type !== currentPriority.eventType
      ) {
        const priority = this.eventTypePriority.findIndex(priorities => nextType.type === priorities);
        if (currentPriority.priority === null || priority < currentPriority.priority) {
          return {
            eventType: nextType.type,
            priority
          };
        }
      }
      return currentPriority;
    }, { eventType: null, priority: null } as { eventType: GlobalEventTypes, priority: number }).eventType;
  }

  // We cache the event results by keying them by the selectedState object.
  private getNewTriggeredEventsOrCached(config: IGlobalEventConfig<any>, appState: GeneralEntityAppState): IGlobalEvent[] {
    const selectedState = config.selector ? config.selector(appState) : appState;
    const isEventTriggered = config.eventTriggered(selectedState);
    if (!isEventTriggered) {
      const dataToEventCache = new Map<any, any>();
      // We should consider changing this, selectedState can be the entire store
      dataToEventCache.set(selectedState, []);
      this.dataCache.set(config, dataToEventCache);
      return [];
    }
    if (Array.isArray(isEventTriggered)) {
      return this.getNewEventsOrCached(isEventTriggered.filter(event => event.triggered), config, selectedState, appState);
    }
    return isEventTriggered.triggered ? this.getNewEventsOrCached(isEventTriggered, config, selectedState, appState) : [];
  }

  private getNewEventsOrCached(
    eventData: GlobalEventData | GlobalEventData[],
    config: IGlobalEventConfig<any>,
    selectedState: any,
    appState: GeneralEntityAppState
  ): IGlobalEvent[] {
    // We will get cached events if the data object matches exactly.
    const cache = this.dataCache.get(config);
    const cachedEvents = cache ? cache.get(selectedState) : null;
    if (cachedEvents) {
      return cachedEvents;
    } else {
      const events = this.getEvents(eventData, selectedState, config, appState);
      const dataToEventCache = new Map<any, any>();
      dataToEventCache.set(selectedState, events);
      this.dataCache.set(config, dataToEventCache);
      return events;
    }
  }

  private getEventsAndPriorityType() {
    return combineLatest(
      this.eventConfigsSubject.asObservable().pipe(
        startWith(this.eventConfigs)
      ),
      this.store
    ).pipe(
      debounceTime(100),
      map(([configs, appState]) => {
        return configs.reduce((eventsAndPriority, config) => {
          const newEvents = this.getNewTriggeredEventsOrCached(config, appState);
          if (newEvents && newEvents.length) {
            const newHighestPriority = this.getHighestPriorityEventType([
              { type: eventsAndPriority[1] },
              ...newEvents,
            ]);
            eventsAndPriority[0] = [...eventsAndPriority[0], ...newEvents];
            eventsAndPriority[1] = newHighestPriority;
          }
          return eventsAndPriority;
        }, [[], null] as [IGlobalEvent[], GlobalEventTypes]);
      }),
      publishReplay(1),
      refCount(),
    );
  }

  private store = inject(Store<GeneralEntityAppState>);
  private injector = inject(Injector);

  constructor() {
    const signalEvents$ = toObservable(this._signalEvents, { injector: this.injector });
    const staticEvents$ = toObservable(this._staticEvents, { injector: this.injector });
    const eventsAndPriority$ = combineLatest([
      this.getEventsAndPriorityType(),
      toObservable(this._readEvents, { injector: this.injector }),
      signalEvents$,
      staticEvents$,
    ]).pipe(
      map(([[ngrxEvents, types], readEvents, signalEvents, staticEvents]) => {
        // Merge ngrx-derived events with signal-published events. Apply
        // read state to both so the page-header banner's dismiss control
        // works the same regardless of source.
        const events = [...ngrxEvents, ...signalEvents, ...Array.from(staticEvents.values())];
        events.forEach(event => {
          event.read = !!readEvents.get(event.key);
        });
        // Remove stale read markers
        readEvents.forEach((a, key) => {
          const oEvent = events.find(event => event.key === key);
          if (!oEvent) {
            this._readEvents.update(events => {
              const newEvents = new Map(events);
              newEvents.delete(key);
              return newEvents;
            });
          }
        });
        return [events, types] as [IGlobalEvent[], GlobalEventTypes];
      })
    );

    this.events$ = eventsAndPriority$.pipe(
      map(eventsAndPriority => eventsAndPriority[0])
    );
    this.priorityType$ = eventsAndPriority$.pipe(
      map(eventsAndPriority => eventsAndPriority[1]),
      distinctUntilChanged()
    );
    this.priorityStratosStatus$ = this.priorityType$.pipe(
      map(priorityEventType => this.eventTypeToStratosStatus(priorityEventType))
    );
  }
}

// CAPI v3 error response shape used by `/v3/...` endpoints.
interface CapiErrorBody {
  errors?: Array<{ detail?: string; title?: string; code?: number | string }>;
  error?: string;
}

/**
 * Best-effort extraction of a human-readable error string from whatever
 * the source's error() signal holds. Tries (in order):
 *   1. CAPI v3 body shape: `{errors: [{detail}]}`
 *   2. Stratos backend wrapped error: `{error: "..."}`
 *   3. HttpErrorResponse status line
 *   4. Native Error.message
 *   5. String coercion fallback
 */
// sessionStorage key for the signal-published endpoint-error events.
// Scoped to the browser tab — survives reload, cleared on tab close.
const SIGNAL_EVENTS_STORAGE_KEY = 'stratos.globalEvents.signalEndpointErrors';

function loadPersistedSignalEvents(): IGlobalEvent[] {
  try {
    const raw = sessionStorage.getItem(SIGNAL_EVENTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as IGlobalEvent[] : [];
  } catch {
    return [];
  }
}

function persistSignalEvents(events: IGlobalEvent[]): void {
  try {
    if (events.length === 0) {
      sessionStorage.removeItem(SIGNAL_EVENTS_STORAGE_KEY);
    } else {
      sessionStorage.setItem(SIGNAL_EVENTS_STORAGE_KEY, JSON.stringify(events));
    }
  } catch {
    // ignore — quota errors, disabled storage, etc. fall back to in-memory only
  }
}

function formatEndpointErrorDetail(err: unknown): string {
  if (err == null) return 'failed to load';
  if (err instanceof HttpErrorResponse) {
    const body = err.error as CapiErrorBody | string | null | undefined;
    if (body && typeof body === 'object') {
      if (body.errors?.[0]?.detail) return body.errors[0].detail;
      if (typeof body.error === 'string') return body.error;
    }
    if (typeof body === 'string' && body.length > 0) return body;
    return `${err.status} ${err.statusText || 'failed to load'}`.trim();
  }
  if (err instanceof Error) return err.message;
  return String(err);
}
