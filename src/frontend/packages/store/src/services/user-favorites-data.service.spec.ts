import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { beforeEach, afterEach, describe, expect, it } from 'vitest';

import { proxyAPIVersion } from '../jetstream';
import { IFavoriteMetadata, UserFavorite } from '../types/user-favorites.types';
import { UserFavoritesDataService } from './user-favorites-data.service';

const FAV_URL = `/pp/${proxyAPIVersion}/favorites`;

// Backend returns plain objects (metadata pre-parsed), not class instances — the
// flat map stores them verbatim, exactly as the legacy request pipeline did.
const entityFav = (entityId: string, endpointId: string, entityType = 'application'): UserFavorite<IFavoriteMetadata> =>
  new UserFavorite(endpointId, 'cf', entityType, entityId, { name: entityId });

const endpointFav = (endpointId: string): UserFavorite<IFavoriteMetadata> =>
  new UserFavorite(endpointId, 'cf', 'endpoint', undefined, { name: endpointId });

describe('UserFavoritesDataService', () => {
  let svc: UserFavoritesDataService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        UserFavoritesDataService,
      ],
    });
    svc = TestBed.inject(UserFavoritesDataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('starts empty, not fetching, not errored', () => {
    expect(svc.favorites().size).toBe(0);
    expect(svc.fetching()).toBe(false);
    expect(svc.error()).toBe(false);
    expect(svc.groups()).toEqual({});
  });

  describe('load', () => {
    it('GETs favorites and keys them by guid; toggles fetching around the request', () => {
      const a = entityFav('app-1', 'cf-1');
      svc.load();
      expect(svc.fetching()).toBe(true);

      const req = httpMock.expectOne(FAV_URL);
      expect(req.request.method).toBe('GET');
      req.flush([a]);

      expect(svc.fetching()).toBe(false);
      expect(svc.error()).toBe(false);
      expect(svc.favorites().get(a.guid)).toEqual(a);
    });

    it('sets error and clears fetching on failure', () => {
      svc.load();
      const req = httpMock.expectOne(FAV_URL);
      req.flush('boom', { status: 500, statusText: 'Server Error' });

      expect(svc.fetching()).toBe(false);
      expect(svc.error()).toBe(true);
      expect(svc.favorites().size).toBe(0);
    });
  });

  describe('isFavorite', () => {
    it('is true once the entity favorite is in the map', () => {
      const a = entityFav('app-1', 'cf-1');
      expect(svc.isFavorite(a)()).toBe(false);
      svc.load();
      httpMock.expectOne(FAV_URL).flush([a]);
      expect(svc.isFavorite(a)()).toBe(true);
    });

    it('is true for an endpoint favorite only when the endpoint is starred', () => {
      const ep = endpointFav('cf-1');
      const child = entityFav('app-1', 'cf-1');
      svc.load();
      // child favorite present but endpoint NOT starred → endpoint isFavorite false
      httpMock.expectOne(FAV_URL).flush([child]);
      expect(svc.isFavorite(ep)()).toBe(false);
      expect(svc.isFavorite(child)()).toBe(true);
    });
  });

  describe('save', () => {
    it('POSTs the payload and stores the server response keyed by guid', () => {
      const a = entityFav('app-1', 'cf-1');
      svc.save(a);
      const req = httpMock.expectOne(FAV_URL);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(a.getPayload());
      req.flush(a);
      expect(svc.favorites().get(a.guid)).toEqual(a);
    });
  });

  describe('remove', () => {
    it('DELETEs by guid and drops it from the map', () => {
      const a = entityFav('app-1', 'cf-1');
      svc.load();
      httpMock.expectOne(FAV_URL).flush([a]);

      svc.remove(a);
      const req = httpMock.expectOne(`${FAV_URL}/${a.guid}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
      expect(svc.favorites().has(a.guid)).toBe(false);
    });
  });

  describe('toggle', () => {
    it('saves when not favorited', () => {
      const a = entityFav('app-1', 'cf-1');
      svc.toggle(a);
      httpMock.expectOne(req => req.method === 'POST' && req.url === FAV_URL).flush(a);
      expect(svc.favorites().has(a.guid)).toBe(true);
    });

    it('removes when already favorited', () => {
      const a = entityFav('app-1', 'cf-1');
      svc.load();
      httpMock.expectOne(FAV_URL).flush([a]);

      svc.toggle(a);
      httpMock.expectOne(`${FAV_URL}/${a.guid}`).flush(null);
      expect(svc.favorites().has(a.guid)).toBe(false);
    });
  });

  describe('updateMetadata', () => {
    it('POSTs metadata to /{guid}/metadata and updates the map with the favorite', () => {
      const a = entityFav('app-1', 'cf-1');
      a.metadata = { name: 'renamed' };
      svc.updateMetadata(a);
      const req = httpMock.expectOne(`${FAV_URL}/${a.guid}/metadata`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(a.metadata);
      req.flush(null);
      expect(svc.favorites().get(a.guid)).toEqual(a);
    });
  });

  describe('removeForDeletedEntity', () => {
    it('DELETEs and drops the favorite when present', () => {
      const a = entityFav('app-1', 'cf-1');
      svc.load();
      httpMock.expectOne(FAV_URL).flush([a]);

      svc.removeForDeletedEntity(a.guid);
      httpMock.expectOne(`${FAV_URL}/${a.guid}`).flush(null);
      expect(svc.favorites().has(a.guid)).toBe(false);
    });

    it('no-ops (no HTTP) when the guid is not a favorite', () => {
      svc.removeForDeletedEntity('not-a-favorite');
      httpMock.expectNone(() => true);
    });
  });

  describe('groups (computed)', () => {
    it('groups entity favorites under their endpoint key as ethereal, non-ethereal once the endpoint is starred', () => {
      const ep = endpointFav('cf-1');
      const child = entityFav('app-1', 'cf-1');
      svc.load();
      httpMock.expectOne(FAV_URL).flush([child]);

      const groupKey = ep.guid; // endpoint-favorite guid = group key
      let groups = svc.groups();
      expect(Object.keys(groups)).toEqual([groupKey]);
      expect(groups[groupKey].ethereal).toBe(true);
      expect(groups[groupKey].entitiesIds).toEqual([child.guid]);

      // Now star the endpoint too
      svc.save(ep);
      httpMock.expectOne(FAV_URL).flush(ep);
      groups = svc.groups();
      expect(groups[groupKey].ethereal).toBe(false);
      expect(groups[groupKey].endpoint.endpointId).toBe('cf-1');
      expect(groups[groupKey].entitiesIds).toEqual([child.guid]);
    });
  });

  describe('observable surface', () => {
    it('favorites$ emits the current map', async () => {
      const a = entityFav('app-1', 'cf-1');
      svc.load();
      httpMock.expectOne(FAV_URL).flush([a]);
      const map = await firstValueFrom(svc.favorites$.pipe(filter(m => m.size > 0), take(1)));
      expect(map.get(a.guid)).toEqual(a);
    });
  });
});
