import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RemoveUserFavoriteAction } from '../actions/user-favourites.actions';
import { UserFavorite } from '../types/user-favorites.types';
import { EntityDeleteCleanupService } from './entity-delete-cleanup.service';
import { RecentlyVisitedDataService } from './recently-visited-data.service';

describe('EntityDeleteCleanupService', () => {
  let svc: EntityDeleteCleanupService;
  let dispatched: any[];
  let removeRecent: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    dispatched = [];
    removeRecent = vi.fn();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        EntityDeleteCleanupService,
        { provide: Store, useValue: { dispatch: (a: any) => dispatched.push(a) } },
        { provide: RecentlyVisitedDataService, useValue: { removeForDeletedEntity: removeRecent } },
      ],
    });
    svc = TestBed.inject(EntityDeleteCleanupService);
  });

  it('removes the favorite (ngrx) and recent (signal) for the deleted entity', () => {
    svc.removeFavoriteAndRecent('cnsi-1', 'k8s', 'pod', 'pod-guid');

    const expected = new UserFavorite('cnsi-1', 'k8s', 'pod', 'pod-guid');
    // favorites are still ngrx until the favorites island wave migrates them
    expect(dispatched).toHaveLength(1);
    expect(dispatched[0]).toBeInstanceOf(RemoveUserFavoriteAction);
    expect(dispatched[0].favorite.guid).toBe(expected.guid);
    // recents are signal-native — removed via the data service, keyed by guid
    expect(removeRecent).toHaveBeenCalledWith(expected.guid);
  });

  it('keys the favorite by endpoint type so CF and k8s entities do not collide', () => {
    svc.removeFavoriteAndRecent('cnsi-1', 'cf', 'application', 'app-guid');
    const cf = new UserFavorite('cnsi-1', 'cf', 'application', 'app-guid');
    expect(dispatched[0].favorite.guid).toBe(cf.guid);
  });
});
