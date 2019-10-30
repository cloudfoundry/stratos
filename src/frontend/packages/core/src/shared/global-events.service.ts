import { GeneralEntityAppState } from './../../../store/src/app-state';
import { Injectable } from '@angular/core';
import { Observable, combineLatest, ReplaySubject } from 'rxjs';
import { Store } from '@ngrx/store';
import { map, publishReplay, refCount, tap, startWith, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { StratosStatus } from './shared.types';

export type GlobalEventTypes = 'warning' | 'error' | 'process' | 'complete';


/**
 * Used to build the message or link for an event
 * @export
 */
export class GlobalEventData<T = any> {
  constructor(public triggered = true, public data?: T) { }
}

interface IGlobalEventType {
  type?: GlobalEventTypes;
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

export interface IGlobalEvent {
  message: string;
  link: string;
  key: string;
  type?: GlobalEventTypes;
  stratosStatus?: StratosStatus;
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

  public events$: Observable<IGlobalEvent[]>;
  public priorityType$: Observable<GlobalEventTypes>;
  public priorityStratosStatus$: Observable<StratosStatus>;
  public addEventConfig<SelectedState, EventState = SelectedState>(event: IGlobalEventConfig<SelectedState, EventState>) {
    this.eventConfigs.push(event);
    this.eventConfigsSubject.next(this.eventConfigs);
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
    const key = typeof config.key === 'function' ? config.key(eventData, appState) : config.link || config.message;
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
  private getNewEventsOrCached(config: IGlobalEventConfig<any>, appState: GeneralEntityAppState): IGlobalEvent[] {
    const selectedState = config.selector ? config.selector(appState) : appState;
    const isEventTriggered = config.eventTriggered(selectedState);
    if (!isEventTriggered) {
      const dataToEventCache = new Map<any, any>();
      dataToEventCache.set(selectedState, []);
      this.dataCache.set(config, dataToEventCache);
      return [];
    }
    if (Array.isArray(isEventTriggered)) {
      return isEventTriggered.reduce((events, eventData) => {
        if (!eventData.triggered) {
          return events;
        }
        return [
          ...events,
          ...this.getNewEventOrCached(eventData, config, selectedState, appState)
        ];
      }, []);
    }
    return isEventTriggered.triggered ? this.getNewEventOrCached(isEventTriggered, config, selectedState, appState) : [];
  }

  private getNewEventOrCached(
    eventData: GlobalEventData,
    config: IGlobalEventConfig<any>,
    selectedState: any,
    appState: GeneralEntityAppState
  ) {
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
          const newEvents = this.getNewEventsOrCached(config, appState);
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

  constructor(private store: Store<GeneralEntityAppState>) {
    const eventsAndPriority$ = this.getEventsAndPriorityType();
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
