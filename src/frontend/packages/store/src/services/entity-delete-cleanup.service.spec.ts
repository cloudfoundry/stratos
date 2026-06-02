import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { beforeEach, describe, expect, it } from 'vitest';

import { RemoveRecentEntityAction } from '../actions/recently-visited.actions';
import { RemoveUserFavoriteAction } from '../actions/user-favourites.actions';
import { UserFavorite } from '../types/user-favorites.types';
import { EntityDeleteCleanupService } from './entity-delete-cleanup.service';

describe('EntityDeleteCleanupService', () => {
  let svc: EntityDeleteCleanupService;
  let dispatched: any[];

  beforeEach(() => {
    dispatched = [];
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        EntityDeleteCleanupService,
        { provide: Store, useValue: { dispatch: (a: any) => dispatched.push(a) } },
      ],
    });
    svc = TestBed.inject(EntityDeleteCleanupService);
  });

  it('removes the favorite and recent for the deleted entity', () => {
    svc.removeFavoriteAndRecent('cnsi-1', 'k8s', 'pod', 'pod-guid');

    const expected = new UserFavorite('cnsi-1', 'k8s', 'pod', 'pod-guid');
    expect(dispatched).toHaveLength(2);
    expect(dispatched[0]).toBeInstanceOf(RemoveUserFavoriteAction);
    expect(dispatched[0].favorite.guid).toBe(expected.guid);
    expect(dispatched[1]).toBeInstanceOf(RemoveRecentEntityAction);
    expect(dispatched[1].guid).toBe(expected.guid);
  });

  it('keys the favorite by endpoint type so CF and k8s entities do not collide', () => {
    svc.removeFavoriteAndRecent('cnsi-1', 'cf', 'application', 'app-guid');
    const cf = new UserFavorite('cnsi-1', 'cf', 'application', 'app-guid');
    expect(dispatched[0].favorite.guid).toBe(cf.guid);
  });
});
