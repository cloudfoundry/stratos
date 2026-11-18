import { Injectable, Signal, computed, effect, signal, inject, untracked } from '@angular/core';
import {
  StratosStatus,
  EndpointsDataService, EndpointErrorEventsService,
} from '@stratosui/store';

export type GlobalEventTypes = 'warning' | 'error' | 'process' | 'complete';

export const endpointEventKey = 'endpointError';

interface IGlobalEventType {
  type?: GlobalEventTypes;
  subType?: string;
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
  private _readEvents = signal<Map<string, IGlobalEvent>>(new Map<string, IGlobalEvent>());
  public readEvents = this._readEvents.asReadonly();

  // Endpoint-error banner events, derived from the signal-native
  // EndpointErrorEventsService (the single source for per-endpoint error
  // history, fed centrally from the signal data layer). Replaces the
  // former imperative publishEndpointErrors/_signalEvents channel and the
  // ngrx event-config channel that read internalEventStateSelector.
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
  // `null` removes that key. Merged into `events` alongside the
  // endpoint-error channel.
  private _staticEvents = signal<ReadonlyMap<string, IGlobalEvent>>(new Map());


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

  // The 'complete' event type (and the no-priority null case) has no
  // associated StratosStatus, so this is genuinely sometimes-absent.
  // Callers treat the absent case as "no status".
  public eventTypeToStratosStatus(eventType: GlobalEventTypes | null): StratosStatus | undefined {
    switch (eventType) {
      case ('warning'):
        return StratosStatus.WARNING;
      case ('process'):
        return StratosStatus.BUSY;
      case ('error'):
        return StratosStatus.ERROR;
      default:
        return undefined;
    }
  }

  private endpointErrorEvents = inject(EndpointErrorEventsService);
  private endpointsData = inject(EndpointsDataService);

  private readonly allEvents = computed(() => [
    ...this._endpointErrorEvents(),
    ...this._staticEvents().values(),
  ]);

  /** Every event, each marked with its read state. */
  public readonly events: Signal<IGlobalEvent[]> = computed(() => {
    const readEvents = this._readEvents();
    return this.allEvents().map(event => ({ ...event, read: !!readEvents.get(event.key) }));
  });


  constructor() {
    // Drop the read marker of an event that has gone, so it shows unread if
    // it comes back.
    effect(() => {
      const keys = new Set(this.allEvents().map(event => event.key));
      const stale = [...untracked(this._readEvents).keys()].filter(key => !keys.has(key));
      if (stale.length) {
        this._readEvents.update(events => {
          const newEvents = new Map(events);
          stale.forEach(key => newEvents.delete(key));
          return newEvents;
        });
      }
    });
  }
}
