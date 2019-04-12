import { AppState } from './../../../store/src/app-state';
import { Injectable } from '@angular/core';
import { Observable, combineLatest, ReplaySubject } from 'rxjs';
import { Store } from '@ngrx/store';
import { map, publishReplay, refCount, tap, startWith, debounceTime } from 'rxjs/operators';

export type IGlobalEventTypes = 'warning' | 'error' | 'process';

/**
 * An global application wide event that is derived from data stored in the store.
 *
 * @export
 * @template EventState The root data that the event can be generated from. Will act as the EventData if no EventData is provided.
 * @template EventData This data can be used to generate the link or message for an event.
 */
export interface IGlobalEventConfig<EventState, EventData = EventState> {

  /**
   * Used to get the part of the store the event may be build from.
   */
  selector: (state: AppState) => EventState;
  message: ((data?: EventData) => string) | string;

  /**
   * Can be used to generate the data for an event.
   * If an array is passed then multiple events will be created of the type provided in the config.
   */
  getEventData?: (state: EventState) => EventData | EventData[];
  link?: ((data?: EventData) => string) | string;
  type?: IGlobalEventTypes;
}

export interface IGlobalEvent {
  message: string;
  link: string;
  type?: IGlobalEventTypes;
}
@Injectable({
  providedIn: 'root'
})
export class GlobalEventService {
  private eventConfigs: IGlobalEventConfig<any, any>[] = [];
  private eventConfigsSubject = new ReplaySubject<IGlobalEventConfig<any, any>[]>();

  public events$: Observable<IGlobalEvent[]>;

  private dataCache = new Map<any, Map<any, any[]>>();

  public addEventConfig<EventState, EventData = EventState>(event: IGlobalEventConfig<EventState, EventData>) {
    this.eventConfigs.push(event);
    this.eventConfigsSubject.next(this.eventConfigs);
  }

  public filterEvents(eventType: IGlobalEventTypes) {
    return this.events$.pipe(
      map(events => events.filter(event => event.type === eventType))
    );
  }

  private getEvent(eventData: any, config: IGlobalEventConfig<any, any>) {
    const message = typeof config.message === 'function' ? config.message(eventData) : config.message;
    const link = typeof config.link === 'function' ? config.link(eventData) : config.link;
    return {
      message,
      link,
      type: config.type || 'warning'
    };
  }

  private getEvents(eventsData: any, config: IGlobalEventConfig<any, any>) {
    if (Array.isArray(eventsData)) {
      if (eventsData.length) {
        return eventsData.map((eventData) => this.getEvent(eventData, config));
      }
    } else {
      return [this.getEvent(eventsData, config)];
    }
  }

  constructor(store: Store<AppState>) {
    this.events$ = combineLatest(
      this.eventConfigsSubject.asObservable().pipe(
        startWith(this.eventConfigs)
      ),
      store
    ).pipe(
      debounceTime(100),
      map(([configs, appState]) => {
        return configs.reduce((allEvents, config) => {
          const selectedState = config.selector(appState);
          const eventsData = config.getEventData ? config.getEventData(selectedState) : selectedState;
          if (eventsData) {
            // We will get cached events if the data object matches exactly.
            const cache = this.dataCache.get(config);
            const cachedEvents = cache ? cache.get(eventsData) : null;
            if (cachedEvents) {
              return [...allEvents, ...cachedEvents];
            } else {
              const events = this.getEvents(eventsData, config);
              const dataToEventCache = new Map<any, any>();
              dataToEventCache.set(eventsData, events);
              this.dataCache.set(config, dataToEventCache);
              return [...allEvents, ...events];
            }
          }
          const dataToEventCache = new Map<any, any>();
          dataToEventCache.set(eventsData, []);
          this.dataCache.set(config, dataToEventCache);
          return allEvents;
        }, [] as IGlobalEvent[]);
      }),
      publishReplay(1),
      refCount(),
    );
  }
}
