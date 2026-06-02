import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UserFavorite } from '../types/user-favorites.types';
import { EntityDeleteCleanupService } from './entity-delete-cleanup.service';
import { RecentlyVisitedDataService } from './recently-visited-data.service';
import { UserFavoritesDataService } from './user-favorites-data.service';

describe('EntityDeleteCleanupService', () => {
  let svc: EntityDeleteCleanupService;
  let removeFavorite: ReturnType<typeof vi.fn>;
  let removeRecent: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    removeFavorite = vi.fn();
    removeRecent = vi.fn();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        EntityDeleteCleanupService,
        { provide: UserFavoritesDataService, useValue: { removeForDeletedEntity: removeFavorite } },
        { provide: RecentlyVisitedDataService, useValue: { removeForDeletedEntity: removeRecent } },
      ],
    });
    svc = TestBed.inject(EntityDeleteCleanupService);
  });

  it('removes the favorite (signal) and recent (signal) for the deleted entity', () => {
    svc.removeFavoriteAndRecent('cnsi-1', 'k8s', 'pod', 'pod-guid');

    const expected = new UserFavorite('cnsi-1', 'k8s', 'pod', 'pod-guid');
    // both halves are signal-native — removed via their data services, keyed by guid
    expect(removeFavorite).toHaveBeenCalledWith(expected.guid);
    expect(removeRecent).toHaveBeenCalledWith(expected.guid);
  });

  it('keys the favorite by endpoint type so CF and k8s entities do not collide', () => {
    svc.removeFavoriteAndRecent('cnsi-1', 'cf', 'application', 'app-guid');
    const cf = new UserFavorite('cnsi-1', 'cf', 'application', 'app-guid');
    expect(removeFavorite).toHaveBeenCalledWith(cf.guid);
  });
});
