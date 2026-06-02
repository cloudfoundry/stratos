import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';

import { IRecentlyVisitedEntity } from '../types/recently-visited.types';
import { MAX_RECENT_COUNT, RecentlyVisitedDataService } from './recently-visited-data.service';

const entry = (guid: string, endpointId: string, date = 1): IRecentlyVisitedEntity => ({
  guid,
  entityId: guid,
  endpointId,
  entityType: 'organization',
  endpointType: 'cf',
  name: guid,
  date,
} as IRecentlyVisitedEntity);

describe('RecentlyVisitedDataService', () => {
  let svc: RecentlyVisitedDataService;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        RecentlyVisitedDataService,
      ],
    });
    svc = TestBed.inject(RecentlyVisitedDataService);
  });

  it('starts with an empty recents map', () => {
    expect(svc.state()).toEqual({});
  });

  describe('add', () => {
    it('adds an entry keyed by guid', () => {
      svc.add(entry('org-1__cnsi-1', 'cnsi-1'));
      expect(svc.state()['org-1__cnsi-1']).toBeDefined();
    });

    it('trims to MAX_RECENT_COUNT (most recent by date) once over the flush threshold', () => {
      // 151 entries trips the flush (> 150) → trimmed to MAX_RECENT_COUNT
      for (let i = 0; i < 151; i++) {
        svc.add(entry(`g-${i}`, 'cnsi-1', i));
      }
      const map = svc.state();
      expect(Object.keys(map).length).toBe(MAX_RECENT_COUNT);
      // The oldest (lowest date) entries are dropped; the newest survives.
      expect(map['g-150']).toBeDefined();
      expect(map['g-0']).toBeUndefined();
    });
  });

  describe('set', () => {
    it('adds/updates an entry without trimming', () => {
      svc.set(entry('org-1__cnsi-1', 'cnsi-1'));
      svc.set({ ...entry('org-1__cnsi-1', 'cnsi-1'), name: 'renamed' });
      expect(svc.state()['org-1__cnsi-1'].name).toBe('renamed');
    });
  });

  describe('removeForDeletedEntity', () => {
    beforeEach(() => {
      svc.set(entry('org-1__cnsi-1', 'cnsi-1'));
      svc.set(entry('org-2__cnsi-1', 'cnsi-1'));
    });

    it('removes the matching recents entry by guid', () => {
      svc.removeForDeletedEntity('org-1__cnsi-1');
      expect(svc.state()['org-1__cnsi-1']).toBeUndefined();
      expect(svc.state()['org-2__cnsi-1']).toBeDefined();
    });

    it('is a no-op when the guid is absent', () => {
      const before = svc.state();
      svc.removeForDeletedEntity('missing');
      expect(svc.state()).toBe(before);
    });
  });

  describe('cleanForEndpoints', () => {
    it('removes entries whose endpoint is in the supplied list', () => {
      svc.set(entry('a', 'cnsi-1'));
      svc.set(entry('b', 'cnsi-2'));
      svc.cleanForEndpoints(['cnsi-1']);
      expect(svc.state()['a']).toBeUndefined();
      expect(svc.state()['b']).toBeDefined();
    });
  });

  describe('pruneToConnected', () => {
    it('keeps only entries whose endpoint is in the supplied list', () => {
      svc.set(entry('a', 'cnsi-1'));
      svc.set(entry('b', 'cnsi-2'));
      svc.pruneToConnected(['cnsi-1']);
      expect(svc.state()['a']).toBeDefined();
      expect(svc.state()['b']).toBeUndefined();
    });
  });

  it('exposes the recents map as an observable', async () => {
    svc.set(entry('org-1__cnsi-1', 'cnsi-1'));
    const emitted = await firstValueFrom(svc.state$);
    expect(emitted['org-1__cnsi-1']).toBeDefined();
  });
});
