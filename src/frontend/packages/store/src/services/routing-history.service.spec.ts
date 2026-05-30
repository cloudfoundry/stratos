import { ApplicationRef, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { take } from 'rxjs/operators';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RoutingEvent } from '../types/routing.type';
import { RoutingHistoryService } from './routing-history.service';

describe('RoutingHistoryService', () => {
  let events$: Subject<unknown>;
  let navId: number;

  function navigate(url: string, urlAfterRedirects: string = url) {
    events$.next(new NavigationEnd(++navId, url, urlAfterRedirects));
  }

  function flushEffects() {
    TestBed.inject(ApplicationRef).tick();
  }

  function makeService(): RoutingHistoryService {
    return TestBed.inject(RoutingHistoryService);
  }

  beforeEach(() => {
    events$ = new Subject<unknown>();
    navId = 0;
    const routerStub = {
      events: events$.asObservable(),
      navigate: vi.fn(),
    };
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: Router, useValue: routerStub },
        RoutingHistoryService,
      ],
    });
  });

  it('starts with null current and previous state', () => {
    const svc = makeService();
    expect(svc.currentState()).toBeNull();
    expect(svc.previousState()).toBeNull();
  });

  it('captures the current route on first navigation, previous stays null', () => {
    const svc = makeService();
    navigate('/home');
    expect(svc.currentState().url).toBe('/home');
    expect(svc.previousState()).toBeNull();
  });

  it('shifts previous <- current on a subsequent navigation', () => {
    const svc = makeService();
    navigate('/home');
    navigate('/applications/new');
    expect(svc.currentState().url).toBe('/applications/new');
    expect(svc.previousState().url).toBe('/home');
  });

  it('ignores a navigation to the same url (dedup, mirrors routingReducer)', () => {
    const svc = makeService();
    navigate('/home');
    navigate('/applications/new');
    navigate('/applications/new');
    expect(svc.currentState().url).toBe('/applications/new');
    expect(svc.previousState().url).toBe('/home');
  });

  it('exposes query params parsed from the url, keeping the query string on url', () => {
    const svc = makeService();
    navigate('/events?endpointGuid=abc&cf=def');
    expect(svc.currentState().url).toBe('/events?endpointGuid=abc&cf=def');
    expect(svc.currentState().state.queryParams).toEqual({ endpointGuid: 'abc', cf: 'def' });
  });

  // The observable bridges preserve store.select(...) replay timing: consumers
  // build their cancel/back observables in the constructor but the async pipe
  // subscribes after view-init, by which point the landing navigation has
  // settled. A late subscriber must therefore see the latest value.
  it('replays the latest previous state to a late subscriber via previousState$', () => {
    const svc = makeService();
    navigate('/home');
    navigate('/applications/new');
    let seen: RoutingEvent | null | undefined;
    svc.previousState$.pipe(take(1)).subscribe(v => (seen = v));
    flushEffects();
    expect(seen?.url).toBe('/home');
  });

  it('replays the latest current state to a late subscriber via currentState$', () => {
    const svc = makeService();
    navigate('/home');
    navigate('/applications/new');
    let seen: RoutingEvent | null | undefined;
    svc.currentState$.pipe(take(1)).subscribe(v => (seen = v));
    flushEffects();
    expect(seen?.url).toBe('/applications/new');
  });
});
