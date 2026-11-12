import { Injectable, Signal, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

import { RoutingEvent } from '../types/routing.type';

/**
 * Signal-native replacement for the ngrx router-store routing slice
 * (`state.routing` / `getPreviousRoutingState` / `getCurrentRoutingState`).
 *
 * Tracks current + previous route by subscribing to Angular Router
 * `NavigationEnd` events, mirroring the dedup-on-same-url behaviour of the
 * old `routingReducer` so consumers (wizard Cancel, error/events back links,
 * cli-info back, app-name breadcrumb) keep the same destination logic without
 * ngrx.
 *
 * MUST be instantiated at bootstrap (see AppComponent) so it captures the
 * navigation that lands the user on a wizard/error route — otherwise the
 * first consumer created on that route would see no previous state and the
 * Cancel/back target would wrongly fall back to /home.
 */
@Injectable({
  providedIn: 'root'
})
export class RoutingHistoryService {
  private router = inject(Router);

  private _currentState = signal<RoutingEvent | null>(null);
  private _previousState = signal<RoutingEvent | null>(null);

  public readonly currentState: Signal<RoutingEvent | null> = this._currentState.asReadonly();
  public readonly previousState: Signal<RoutingEvent | null> = this._previousState.asReadonly();

  constructor() {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe(event => this.record(event));
  }

  private record(event: NavigationEnd): void {
    const next = this.toRoutingEvent(event);
    const current = this._currentState();
    // Mirror routingReducer: ignore navigations that don't change the url so
    // the previous state isn't clobbered by same-route re-navigations.
    if (current && current.url === next.url) {
      return;
    }
    this._previousState.set(current);
    this._currentState.set(next);
  }

  private toRoutingEvent(event: NavigationEnd): RoutingEvent {
    const url = event.urlAfterRedirects;
    const [path, queryString] = url.split('?');
    const queryParams: { [key: string]: string } = {};
    if (queryString) {
      new URLSearchParams(queryString).forEach((value, key) => {
        queryParams[key] = value;
      });
    }
    return {
      id: event.id,
      url,
      urlAfterRedirects: event.urlAfterRedirects,
      state: {
        url: path,
        params: {},
        queryParams,
      },
    };
  }
}
