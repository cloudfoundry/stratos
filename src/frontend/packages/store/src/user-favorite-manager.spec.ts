import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { proxyAPIVersion } from './jetstream';
import { UserFavoritesDataService } from './services/user-favorites-data.service';
import { IFavoriteMetadata, UserFavorite } from './types/user-favorites.types';
import { UserFavoriteManager } from './user-favorite-manager';

const FAV_URL = `/pp/${proxyAPIVersion}/favorites`;

const entityFav = (entityId: string, endpointId: string, entityType = 'application', endpointType = 'cf') =>
  new UserFavorite<IFavoriteMetadata>(endpointId, endpointType, entityType, entityId, { name: entityId });

const endpointFav = (endpointId: string) =>
  new UserFavorite<IFavoriteMetadata>(endpointId, 'cf', 'endpoint', undefined, { name: endpointId });

describe('UserFavoriteManager', () => {
  let manager: UserFavoriteManager;
  let data: UserFavoritesDataService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    manager = TestBed.inject(UserFavoriteManager);
    data = TestBed.inject(UserFavoritesDataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('holds no favorites while they load, then the groups and the record', () => {
    data.load();
    expect(manager.allFavorites()).toBeUndefined();

    const app = entityFav('app-1', 'cf-1');
    httpMock.expectOne(FAV_URL).flush([app]);

    const all = manager.allFavorites();
    expect(all).toBeDefined();
    expect(all![0][endpointFav('cf-1').guid].entitiesIds).toEqual([app.guid]);
    expect(all![1][app.guid]).toEqual(app);
  });

  it('holds no favorites after a failed load', () => {
    data.load();
    httpMock.expectOne(FAV_URL).flush('no', { status: 500, statusText: 'Server Error' });
    expect(manager.allFavorites()).toBeUndefined();
  });

  it('gives the row keys of starred entities of the asked types only', () => {
    data.load();
    httpMock.expectOne(FAV_URL).flush([
      entityFav('app-1', 'cf-1'),
      entityFav('org-1', 'cf-1', 'organization'),
      entityFav('app-2', 'k8s-1', 'application', 'kubernetes'),
      endpointFav('cf-1'),
    ]);
    expect([...manager.entityFavoriteKeys('cf', ['application'])]).toEqual(['cf-1:app-1']);
    expect([...manager.entityFavoriteKeys('cf', ['application', 'organization'])].sort())
      .toEqual(['cf-1:app-1', 'cf-1:org-1']);
  });

  it('lists the starred entities of one endpoint once loaded', () => {
    const forEndpoint = manager.favoritesForEndpoint('cf-1');
    data.load();
    expect(forEndpoint()).toBeUndefined();
    httpMock.expectOne(FAV_URL).flush([
      entityFav('app-1', 'cf-1'),
      entityFav('app-2', 'cf-2'),
      endpointFav('cf-1'),
    ]);
    expect(forEndpoint()!.map(f => f.entityId)).toEqual(['app-1']);
  });
});
