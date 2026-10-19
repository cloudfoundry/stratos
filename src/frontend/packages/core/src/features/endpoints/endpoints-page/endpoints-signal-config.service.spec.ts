import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EndpointModel, EndpointsDataService } from '@stratosui/store';

import { EndpointsSignalService } from '../../../core/signals/endpoints-signal.service';
import { EndpointsSignalConfigService } from './endpoints-signal-config.service';

function ep(guid: string, name: string): EndpointModel {
  return { guid, name } as EndpointModel;
}

describe('EndpointsSignalConfigService', () => {
  let svc: EndpointsSignalConfigService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: EndpointsSignalService,
          useValue: { endpoints: signal({ a: ep('a', 'Alpha'), b: ep('b', 'Beta'), c: ep('c', 'alphabet') }) },
        },
        { provide: EndpointsDataService, useValue: { loading: signal(false) } },
      ],
    });
    svc = TestBed.inject(EndpointsSignalConfigService);
  });

  it('filters by name, case-insensitively', () => {
    svc.initialize();
    expect(svc.view.filteredItems().length).toBe(3);

    svc.nameFilter.set('  ALPHA ');
    TestBed.tick();
    expect(svc.view.filteredItems().map(e => e.guid).sort()).toEqual(['a', 'c']);

    svc.nameFilter.set('');
    TestBed.tick();
    expect(svc.view.filteredItems().length).toBe(3);
  });

  // The service is root-provided and initialize() runs on every visit to
  // the endpoints page: anything it starts must not pile up per visit.
  it('does not add a name-filter watcher per initialize()', () => {
    const nameFilter = svc.nameFilter;
    const reads = vi.spyOn(svc, 'nameFilter');
    for (let i = 0; i < 5; i++) {
      svc.initialize();
    }
    TestBed.tick();
    svc.view.filteredItems();
    reads.mockClear();

    nameFilter.set('beta');
    TestBed.tick();
    expect(svc.view.filteredItems().map(e => e.guid)).toEqual(['b']);
    expect(reads.mock.calls.length).toBeLessThanOrEqual(1);
  });
});
