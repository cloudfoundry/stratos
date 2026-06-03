import { Injectable, computed, signal, Injector, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  StratosStatus, GeneralEntityAppState,
  EndpointsDataService, EndpointErrorEventsService,
} from '@stratosui/store';
import { toObservable } from '@angular/core/rxjs-interop';
import { combineLatest, Observable, ReplaySubject } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, publishReplay, refCount, startWith } from 'rxjs/operators';

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

  // Endpoint-error banner events, derived from the signal-native
  // EndpointErrorEventsService (the single source for per-endpoint error
  // history, fed centrally from the signal data layer). Replaces both the
  // former imperative publishEndpointErrors/_signalEvents channel and the
  // ngrx app.module addEventConfig that read internalEventStateSelector.
  // One event per endpoint with ≥1 backend (5xx) error; links to the
  // /errors/:id history page.
  private readonly _endpointErrorEvents = computed<IGlobalEvent[]>(() => {
    const byEndpoint = this.endpointErrorEvents.eventsByEndpoint();
    const names = this.endpointsData.endpoints();
    const events: IGlobalEvent[] = [];
    byEndpoint.forEach((errs, guid) => {
      const backendErrors = errs.filter(e => parseInt(e.eventCode, 10) >= 500);
      if (!backendErrors.length) { return; }
      const name = names.get(guid)?.name ?? guid;
      events.push({
        key: `${endpointEventKey}-${guid}`,
        message: backendErrors.length > 1
          ? `There are ${backendErrors.length} errors associated with the endpoint '${name}'`
          : `There is an error associated with the endpoint '${name}'`,
        endpointName: name,
        endpointId: guid,
        detail: backendErrors[0].message,
        link: `/errors/${guid}`,
        type: 'error',
        stratosStatus: this.eventTypeToStratosStatus('error'),
      });
    });
    return events;
  });

  // Per-key static events published from signal-driven sources (e.g.
  // app.module's timeout-session / polling-disabled banners that used to
  // observe `state.dashboard.*` via ngrx). Each entry is keyed; setting
  // `null` removes that key. Merged into `events$` alongside the ngrx-
  // driven and endpoint-error channels.
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
    // User-supplied callbacks can crash when eventData is undefined — e.g.
    // an endpoint-error event whose entity never resolved. Treat any
    // throw as "no link/message" so the event still emits its key/type
    // and the row template's `@if (event.link)` guard hides the View
    // button cleanly.
    const safe = <T>(fn: () => T, fallback: T): T => {
      try { return fn(); } catch { return fallback; }
    };
    const messageFn = config.message;
    const linkFn = config.link;
    const keyFn = config.key;
    const message = typeof messageFn === 'function'
      ? safe(() => messageFn(eventData, appState), '')
      : messageFn;
    const link = typeof linkFn === 'function'
      ? safe(() => linkFn(eventData, appState), '')
      : linkFn;
    const key = typeof keyFn === 'function'
      ? safe(() => keyFn(eventData, appState), '')
      : keyFn || config.message;
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
  private endpointErrorEvents = inject(EndpointErrorEventsService);
  private endpointsData = inject(EndpointsDataService);

  constructor() {
    const endpointErrorEvents$ = toObservable(this._endpointErrorEvents, { injector: this.injector });
    const staticEvents$ = toObservable(this._staticEvents, { injector: this.injector });
    const eventsAndPriority$ = combineLatest([
      this.getEventsAndPriorityType(),
      toObservable(this._readEvents, { injector: this.injector }),
      endpointErrorEvents$,
      staticEvents$,
    ]).pipe(
      map(([[ngrxEvents, types], readEvents, endpointErrors, staticEvents]) => {
        // Merge ngrx-derived events with the signal-native endpoint-error
        // events. Apply read state to all so the page-header banner's
        // dismiss control works the same regardless of source.
        const events = [...ngrxEvents, ...endpointErrors, ...Array.from(staticEvents.values())];
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
