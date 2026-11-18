import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RoutingHistoryService } from './routing-history.service';

describe('RoutingHistoryService', () => {
  let events$: Subject<unknown>;
  let navId: number;

  function navigate(url: string, urlAfterRedirects: string = url) {
    events$.next(new NavigationEnd(++navId, url, urlAfterRedirects));
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
    // strict: a navigation was just dispatched, so currentState is non-null here
    expect(svc.currentState()!.url).toBe('/home');
    expect(svc.previousState()).toBeNull();
  });

  it('shifts previous <- current on a subsequent navigation', () => {
    const svc = makeService();
    navigate('/home');
    navigate('/applications/new');
    // strict: two navigations were dispatched, so both states are non-null here
    expect(svc.currentState()!.url).toBe('/applications/new');
    expect(svc.previousState()!.url).toBe('/home');
  });

  it('ignores a navigation to the same url (dedup, mirrors routingReducer)', () => {
    const svc = makeService();
    navigate('/home');
    navigate('/applications/new');
    navigate('/applications/new');
    // strict: navigations were dispatched, so both states are non-null here
    expect(svc.currentState()!.url).toBe('/applications/new');
    expect(svc.previousState()!.url).toBe('/home');
  });

  it('exposes query params parsed from the url, keeping the query string on url', () => {
    const svc = makeService();
    navigate('/events?endpointGuid=abc&cf=def');
    // strict: a navigation was just dispatched, so currentState is non-null here
    expect(svc.currentState()!.url).toBe('/events?endpointGuid=abc&cf=def');
    expect(svc.currentState()!.state.queryParams).toEqual({ endpointGuid: 'abc', cf: 'def' });
  });
});
