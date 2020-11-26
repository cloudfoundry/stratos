import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, Observable, of } from 'rxjs';
import { filter, map, switchMap, tap } from 'rxjs/operators';

import { GeneralEntityAppState, IRequestEntityTypeState } from './app-state';
import { StratosBaseCatalogEntity } from './entity-catalog/entity-catalog-entity/entity-catalog-entity';
import { EntityCatalogHelpers } from './entity-catalog/entity-catalog.helper';
import { IEntityMetadata, IStratosEntityDefinition } from './entity-catalog/entity-catalog.types';
import { EndpointModel, entityCatalog } from './public-api';
import { endpointEntitiesSelector } from './selectors/endpoint.selectors';
import {
  errorFetchingFavoritesSelector,
  favoriteEntitiesSelector,
  favoriteGroupsSelector,
  fetchingFavoritesSelector,
} from './selectors/favorite-groups.selectors';
import { isFavorite } from './selectors/favorite.selectors';
import { stratosEntityCatalog } from './stratos-entity-catalog';
import { IUserFavoritesGroups } from './types/favorite-groups.types';
import {
  IEndpointFavMetadata,
  IFavoriteMetadata,
  IFavoriteTypeInfo,
  UserFavorite,
  UserFavoriteEndpoint,
} from './types/user-favorites.types';


interface IGroupedFavorites {
  endpoint: UserFavorite<IEndpointFavMetadata>;
  entities: UserFavorite<IFavoriteMetadata>[];
}

@Injectable({
  providedIn: 'root'
})
export class UserFavoriteManager {
  constructor(private store: Store<GeneralEntityAppState>) { }

  public getAllFavorites() {
    const waitForFavorites$ = this.getWaitForFavoritesObservable();
    const favoriteGroups$ = this.store.select(favoriteGroupsSelector);
    const favoriteEntities$ = this.store.select(favoriteEntitiesSelector);
    const combined$ = combineLatest(
      favoriteGroups$,
      favoriteEntities$
    );
    return waitForFavorites$
      .pipe(switchMap(() => combined$));
  }

  private getWaitForFavoritesObservable() {
    return combineLatest(
      this.store.select(fetchingFavoritesSelector),
      this.store.select(errorFetchingFavoritesSelector)
    ).pipe(
      tap(([fetching, error]) => {
        if (error) {
          throw new Error('Could not fetch favorites');
        }
      }),
      filter(([fetching]) => fetching === false),
    );
  }

  public hydrateAllFavorites(): Observable<IGroupedFavorites[]> {
    return this.getAllFavorites().pipe(
      filter(([groups, favoriteEntities]) => !!groups && !!favoriteEntities),
      switchMap(([groups, favoriteEntities]) => this.getHydratedGroups(groups, favoriteEntities))
    );
  }

  private getHydratedGroups = (
    groups: IUserFavoritesGroups,
    favoriteEntities: IRequestEntityTypeState<UserFavorite<IFavoriteMetadata>>
  ): Observable<IGroupedFavorites[]> => {
    const hydrationResults$ = Object.keys(groups).map(
      endpointGuid => this.hydrateGroup(groups[endpointGuid].entitiesIds, endpointGuid, favoriteEntities)
    );
    if (!hydrationResults$ || !hydrationResults$.length) {
      return of([]);
    }
    return combineLatest(
      hydrationResults$
    );
  }

  private hydrateGroup(
    favEntitiesGuid: string[],
    endpointFavoriteGuid: string,
    favoriteEntities: IRequestEntityTypeState<UserFavorite<IFavoriteMetadata>>
  ): Observable<IGroupedFavorites> {
    const endpointFav = favoriteEntities[endpointFavoriteGuid] as UserFavorite<IEndpointFavMetadata>;
    const entities = favEntitiesGuid.map(guid => this.getUserFavoriteFromObject(favoriteEntities[guid]));
    if (!endpointFav) {
      return this.store.select(endpointEntitiesSelector).pipe(
        map(endpoints => {
          const endpointGuid = UserFavorite.getEntityGuidFromFavoriteGuid(endpointFavoriteGuid);
          const endpointEntity = endpoints[endpointGuid];
          return this.getFavoriteEndpointFromEntity(endpointEntity);
        }),
        map(endpointFavorite => ({
          endpoint: this.getUserFavoriteFromObject<IEndpointFavMetadata>(endpointFavorite),
          entities
        }))
      );
    }
    return of({
      endpoint: this.getUserFavoriteFromObject<IEndpointFavMetadata>(endpointFav),
      entities
    });
  }

  public getUserFavoriteFromObject = <T extends IFavoriteMetadata = IFavoriteMetadata>(f: IFavoriteTypeInfo<T>): UserFavorite<T> => {
    return new UserFavorite<T>(f.endpointId, f.endpointType, f.entityType, f.entityId, f.metadata);
  }

  public getIsFavoriteObservable(favorite: UserFavorite<IFavoriteMetadata>) {
    return this.store.select(
      isFavorite(favorite)
    );
  }

  public toggleFavorite(favorite: UserFavorite<IFavoriteMetadata>) {
    stratosEntityCatalog.userFavorite.api.toggle(favorite);
  }

  // Get all favorites for the given endpoint ID
  public getFavoritesForEndpoint(endpointID: string): Observable<UserFavorite<IFavoriteMetadata>[]> {
    const waitForFavorites$ = this.getWaitForFavoritesObservable();
    const favoriteEntities$ = this.store.select(favoriteEntitiesSelector);
    return waitForFavorites$.pipe(switchMap(() => favoriteEntities$)).pipe(
      map(favs => {
        const result = [];
        Object.values(favs).forEach(f => {
          if (f.endpointId === endpointID && f.entityId) {
            // Ensure we actually have a UserFavorite object and not a struct
            result.push(this.getUserFavoriteFromObject(f));
          }
        });
        return result;
      })
    );
  }

  /**
   * For a given favorite, return the corresponding metadata
   */
  public getEntityMetadata(favorite: IFavoriteTypeInfo, entity: any) {
    const catalogEntity = entityCatalog.getEntity(favorite.endpointType, favorite.entityType);
    return catalogEntity ? catalogEntity.builders.entityBuilder.getMetadata(entity) : null;
  }

   private buildFavoriteFromCatalogEntity<T extends IEntityMetadata = IEntityMetadata, Y = any>(
    catalogEntity: StratosBaseCatalogEntity<T, Y>,
    entity: any,
    endpointId: string
  ) {
    const isEndpoint = catalogEntity.isEndpoint;
    const entityDefinition = catalogEntity.definition as IStratosEntityDefinition;
    const endpointType = isEndpoint ? catalogEntity.getTypeAndSubtype().type : entityDefinition.endpoint.type;
    const entityType = isEndpoint ? EntityCatalogHelpers.endpointType : entityDefinition.type;
    const metadata = catalogEntity.builders.entityBuilder.getMetadata(entity);
    const guid = isEndpoint ? null : catalogEntity.builders.entityBuilder.getGuid(entity);
    if (!endpointId) {
      console.error('User favourite - buildFavoriteFromCatalogEntity - endpointId is undefined');
    }
    return new UserFavorite<T>(
      endpointId,
      endpointType,
      entityType,
      guid,
      metadata
    );
  }

  public getFavoriteFromEntity<T extends IEntityMetadata = IEntityMetadata, Y = any>(
    entityType: string,
    endpointType: string,
    endpointId: string,
    entity: Y
  ) {
    const catalogEntity = entityCatalog.getEntity<T, Y>(endpointType, entityType) as StratosBaseCatalogEntity<T, Y>;
    return this.buildFavoriteFromCatalogEntity<T, Y>(catalogEntity, entity, endpointId);
  }

  public getFavoriteEndpointFromEntity(
    endpoint: EndpointModel
  ): UserFavoriteEndpoint {
    return this.getFavoriteFromEntity(
      EntityCatalogHelpers.endpointType,
      endpoint.cnsi_type,
      endpoint.guid,
      endpoint
    );
  }

  // Determine is an endpoint has any entities that can be favorited
  public endpointHasEntitiesThatCanFavorite(endpointType: string) {
    const entities = entityCatalog.getAllEntitiesForEndpointType(endpointType);
    let total = 0;
    entities.forEach(e => {
      const defn = e.builders?.entityBuilder;
      if (defn) {
        const canFavorite = defn.getGuid && defn.getMetadata && defn.getLink;
        if (canFavorite) {
          total++;
        }
      }
    });
    return total > 0;
  }

}
