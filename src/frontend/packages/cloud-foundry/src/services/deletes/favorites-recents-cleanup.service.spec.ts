import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { Store } from '@ngrx/store';
import { RecentlyVisitedDataService, RemoveUserFavoriteAction, UserFavorite } from '@stratosui/store';
import { FavoritesRecentsDeleteCleanup } from './favorites-recents-cleanup.service';
import type { DeleteRequest } from './delete-event.types';

const ORG_REQUEST: DeleteRequest = {
  cnsiGuid: 'cnsi-1',
  cnsiName: 'My CF',
  entityKind: 'organization',
  deleteGuid: 'org-1',
  deleteName: 'demo-org',
  call: () => undefined as never,
};

describe('FavoritesRecentsDeleteCleanup', () => {
  let dispatch: ReturnType<typeof vi.fn>;
  let removeRecent: ReturnType<typeof vi.fn>;
  let service: FavoritesRecentsDeleteCleanup;

  beforeEach(() => {
    dispatch = vi.fn();
    removeRecent = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        FavoritesRecentsDeleteCleanup,
        { provide: Store, useValue: { dispatch } },
        { provide: RecentlyVisitedDataService, useValue: { removeForDeletedEntity: removeRecent } },
      ],
    });
    service = TestBed.inject(FavoritesRecentsDeleteCleanup);
  });

  it('dispatches RemoveUserFavoriteAction for the deleted entity', () => {
    service.hook(ORG_REQUEST);
    const fav = dispatch.mock.calls
      .map(c => c[0])
      .find(a => a instanceof RemoveUserFavoriteAction);
    expect(fav).toBeInstanceOf(RemoveUserFavoriteAction);
    // The favorite identity must match how the org was favorited.
    const expected = new UserFavorite('cnsi-1', 'cf', 'organization', 'org-1');
    expect((fav as RemoveUserFavoriteAction).guid).toBe(expected.guid);
  });

  it('removes the recent (signal-native) with the matching favorite guid', () => {
    service.hook(ORG_REQUEST);
    const expected = new UserFavorite('cnsi-1', 'cf', 'organization', 'org-1');
    expect(removeRecent).toHaveBeenCalledWith(expected.guid);
  });
});
