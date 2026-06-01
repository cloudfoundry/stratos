import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { ApplicationRef, provideZonelessChangeDetection } from '@angular/core';
import { CfAuditEventsSignalConfigService } from './cf-audit-events-signal-config.service';
import type { StAuditEvent } from '../../../services/endpoint-data/stratos-types';

function makeEvent(overrides: Partial<StAuditEvent>): StAuditEvent {
  return {
    guid: 'event-1',
    type: 'audit.app.create',
    actorGuid: 'user-1',
    actorType: 'user',
    actorName: 'alice',
    targetGuid: 'app-1',
    targetType: 'app',
    targetName: 'myapp',
    spaceGuid: 'space-1',
    spaceName: 'dev',
    organizationGuid: 'org-1',
    organizationName: 'engineering',
    data: '{}',
    cnsiGuid: 'cnsi-1',
    createdAt: '2026-04-22T12:00:00Z',
    updatedAt: '2026-04-22T12:00:00Z',
    ...overrides,
  };
}

function makeHttp(events: StAuditEvent[]): HttpClient {
  return {
    get: vi.fn(() => of({
      resources: events,
      pagination: {
        totalResults: events.length,
        totalPages: 1,
        next: null,
        previous: null,
        first: { href: '' },
        last: { href: '' },
      },
    })),
  } as unknown as HttpClient;
}

function makeSvc(http: HttpClient): CfAuditEventsSignalConfigService {
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      { provide: HttpClient, useValue: http },
      CfAuditEventsSignalConfigService,
    ],
  });
  return TestBed.inject(CfAuditEventsSignalConfigService);
}

beforeEach(() => TestBed.resetTestingModule());

describe('CfAuditEventsSignalConfigService', () => {
  it('exposes empty events before initialize', () => {
    const svc = makeSvc(makeHttp([]));
    expect(svc.auditEvents()).toEqual([]);
  });

  it('exposes filter, sort, pageSize, pageIndex, nameFilter signals', () => {
    const svc = makeSvc(makeHttp([]));
    svc.initialize('cnsi-1');
    expect(svc.filter).toBeDefined();
    expect(svc.sort).toBeDefined();
    expect(svc.pageSize).toBeDefined();
    expect(svc.pageIndex).toBeDefined();
    expect(svc.nameFilter).toBeDefined();
  });

  it('builds a ViewPipeline driven by the auditEvents signal', () => {
    const svc = makeSvc(makeHttp([]));
    svc.initialize('cnsi-1');
    expect(svc.view).toBeDefined();
  });

  it('loads audit events from /pp/v1/cf/audit_events/:cnsi', async () => {
    const http = makeHttp([
      makeEvent({ guid: 'e1', type: 'audit.app.create' }),
      makeEvent({ guid: 'e2', type: 'audit.user.login' }),
    ]);
    const svc = makeSvc(http);
    svc.initialize('cnsi-1');
    await svc.loadAll();

    expect(svc.auditEvents().length).toBe(2);
    expect(svc.auditEvents()[0].type).toBe('audit.app.create');
    expect(http.get).toHaveBeenCalledWith(
      expect.stringContaining('/pp/v1/cf/audit_events/cnsi-1'),
    );
  });

  it('basePredicate ANDs with nameFilter to allow per-page scoping', async () => {
    const http = makeHttp([
      makeEvent({ guid: 'e1', type: 'audit.app.create', spaceGuid: 'space-1' }),
      makeEvent({ guid: 'e2', type: 'audit.app.update', spaceGuid: 'space-2' }),
      makeEvent({ guid: 'e3', type: 'audit.app.delete', spaceGuid: 'space-1' }),
    ]);
    const svc = makeSvc(http);
    const appRef = TestBed.inject(ApplicationRef);
    svc.basePredicate.set(ev => ev.spaceGuid === 'space-1');
    svc.initialize('cnsi-1');
    await svc.loadAll();
    appRef.tick(); // Flush the effect bound by initialize().

    // basePredicate alone keeps space-1 events.
    expect(svc.view.pagedItems().length).toBe(2);

    // nameFilter ANDs into basePredicate.
    svc.nameFilter.set('delete');
    appRef.tick();
    expect(svc.view.pagedItems().length).toBe(1);
    expect(svc.view.pagedItems()[0].type).toBe('audit.app.delete');
  });

  it('clearFilters resets nameFilter, sort and pageIndex to defaults', () => {
    const svc = makeSvc(makeHttp([]));
    svc.initialize('cnsi-1');
    svc.nameFilter.set('foo');
    svc.sort.set({ field: 'createdAt', direction: 'asc' });
    svc.pageIndex.set(3);

    svc.clearFilters();

    expect(svc.nameFilter()).toBe('');
    expect(svc.sort().direction).toBe('desc');
    expect(svc.pageIndex()).toBe(0);
  });
});
