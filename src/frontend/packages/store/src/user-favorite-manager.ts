import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, Observable, of } from 'rxjs';
import { filter, map, switchMap, tap } from 'rxjs/operators';

import { GeneralEntityAppState, IRequestEntityTypeState } from './app-state';
import { StratosBaseCatalogEntity } from './entity-catalog/entity-catalog-entity/entity-catalog-entity';
import { EntityCatalogHelpers } from './entity-catalog/entity-catalog.helper';
import { IEntityMetadata, IStratosEntityDefinition } from './entity-catalog/entity-catalog.types';
import { EndpointModel, entityCatalog } from './public-api';
import {
  errorFetchingFavoritesSelector,
  favoriteEntitiesSelector,
  favoriteGroupsSelector,
  fetchingFavoritesSelector,
} from './selectors/favorite-groups.selectors';
import { isFavorite } from './selectors/favorite.selectors';
import { EndpointsDataService } from './services/endpoints-data.service';
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
  private store = inject(Store<GeneralEntityAppState>);
  private endpointsService = inject(EndpointsDataService);

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
        // Defensive: Log error details before throwing
        if (error) {
          console.error('User favorites: Error fetching favorites from store', { fetching, error });
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
      // Wave 5 (W36-B) decision C: legacy favorites point at endpoints by
      // guid. Resolve via EndpointsDataService.endpointById signal rather
      // than the deleted endpointEntitiesSelector.
      const endpointGuid = UserFavorite.getEntityGuidFromFavoriteGuid(endpointFavoriteGuid);
      const endpointEntity = this.endpointsService.endpointById(endpointGuid)();
      const endpointFavorite = this.getFavoriteEndpointFromEntity(endpointEntity);
      return of({
        endpoint: this.getUserFavoriteFromObject<IEndpointFavMetadata>(endpointFavorite),
        entities
      });
    }
    return of({
      endpoint: this.getUserFavoriteFromObject<IEndpointFavMetadata>(endpointFav),
      entities
    });
  }

  public getUserFavoriteFromObject = <T extends IFavoriteMetadata = IFavoriteMetadata>(f: IFavoriteTypeInfo<T>): UserFavorite<T> => {
    // Defensive: Validate favorite object before creating UserFavorite
    if (!f) {
      console.error('User favorites: getUserFavoriteFromObject - favorite object is null or undefined');
      return null;
    }

    if (!f.endpointId || !f.endpointType || !f.entityType) {
      console.error('User favorites: getUserFavoriteFromObject - missing required fields', {
        hasEndpointId: !!f.endpointId,
        hasEndpointType: !!f.endpointType,
        hasEntityType: !!f.entityType,
        favorite: f
      });
      return null;
    }

    return new UserFavorite<T>(f.endpointId, f.endpointType, f.entityType, f.entityId, f.metadata);
  }

  public getIsFavoriteObservable(favorite: UserFavorite<IFavoriteMetadata>) {
    // Defensive: Validate favorite before selecting from store
    if (!favorite) {
      console.error('User favorites: getIsFavoriteObservable - favorite is null or undefined');
      return of(false);
    }

    return this.store.select(
      isFavorite(favorite)
    );
  }

  public toggleFavorite(favorite: UserFavorite<IFavoriteMetadata>) {
    // Defensive: Validate favorite before toggling
    if (!favorite) {
      console.error('User favorites: toggleFavorite - favorite is null or undefined');
      return;
    }

    stratosEntityCatalog.userFavorite.api.toggle(favorite);
  }

  // Get all favorites for the given endpoint ID
  public getFavoritesForEndpoint(endpointID: string): Observable<UserFavorite<IFavoriteMetadata>[]> {
    const waitForFavorites$ = this.getWaitForFavoritesObservable();
    const favoriteEntities$ = this.store.select(favoriteEntitiesSelector);
    return waitForFavorites$.pipe(switchMap(() => favoriteEntities$)).pipe(
      map(favs => {
        const result: Array<UserFavorite<IFavoriteMetadata>> = [];
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
    if (!catalogEntity) {
      // Only warn for non-endpoint entities. Endpoint lookups may use fallback logic in the catalog
      // which searches both the endpoints and entities maps. The warning from entityCatalog.getEntity
      // is sufficient for debugging, no need to duplicate here for endpoint types.
      if (favorite.entityType !== EntityCatalogHelpers.endpointType) {
        console.warn(
          `User favourite - getEntityMetadata - catalogEntity not found for endpointType=${favorite.endpointType}, entityType=${favorite.entityType}`
        );
      }
      return null;
    }
    return catalogEntity.builders?.entityBuilder?.getMetadata(entity) || null;
  }

   private buildFavoriteFromCatalogEntity<T extends IEntityMetadata = IEntityMetadata, Y = any>(
    catalogEntity: StratosBaseCatalogEntity<T, Y>,
    entity: any,
    endpointId: string
  ) {
    if (!catalogEntity) {
      console.warn('User favourite - buildFavoriteFromCatalogEntity - catalogEntity is undefined');
      return null;
    }
    if (!catalogEntity.definition) {
      console.warn('User favourite - buildFavoriteFromCatalogEntity - catalogEntity.definition is undefined');
      return null;
    }
    const isEndpoint = catalogEntity.isEndpoint;
    const entityDefinition = catalogEntity.definition as IStratosEntityDefinition;
    const endpointType = isEndpoint ? catalogEntity.getTypeAndSubtype().type : entityDefinition.endpoint?.type;
    const entityType = isEndpoint ? EntityCatalogHelpers.endpointType : entityDefinition.type;
    const metadata = catalogEntity.builders?.entityBuilder?.getMetadata(entity);
    const guid = isEndpoint ? null : catalogEntity.builders?.entityBuilder?.getGuid(entity);
    // Transient state during data load: callers retry once the entity row
    // resolves with a stamped endpoint id. Skip silently rather than emit
    // a UserFavorite with no endpoint context (which can't round-trip
    // through the favorites store anyway).
    if (!endpointId) {
      return null;
    }
    return new UserFavorite<T>(
      endpointId,
      endpointType,
      entityType,
      guid,
      metadata
    );
  }

  // Get a favorite for the given entity
  public getFavorite<Y extends IEntityMetadata = IEntityMetadata>(
    entity: any,
    entityType: string,
    endpointType: string
  ) {
    // We need to get the endpoint ID for the entity
    // Defensive: Entity catalog lookup may return null if endpoint type not registered yet
    const endpointCatalogEntity = entityCatalog.getEndpoint(endpointType);
    if (!endpointCatalogEntity) {
      console.warn(
        `User favourite - getFavorite - endpoint catalog entity not found for endpointType=${endpointType}. ` +
        `Cannot create favorite for entity type ${entityType}.`
      );
      return null;
    }

    // Defensive: Verify definition and required methods exist
    if (entity && endpointCatalogEntity.definition?.getEndpointIdFromEntity) {
      const id = endpointCatalogEntity.definition.getEndpointIdFromEntity(entity);
      return this.getFavoriteFromEntity<Y>(entityType, endpointType, id, entity);
    }
    return null;
  }

  // Public so list cards on single-endpoint pages can supply the page's
  // endpoint id explicitly. The default getFavorite() reads endpoint id off
  // the entity row, but ngrx dedupes rows across Stratos endpoints that
  // share a backend (e.g. multiple CF endpoints on one CAPI), so the row's
  // stamped endpoint id can differ from the page's context — leading to
  // stars rendering on the wrong endpoint's list page.
  public getFavoriteFromEntity<T extends IEntityMetadata = IEntityMetadata, Y = any>(
    entityType: string,
    endpointType: string,
    endpointId: string,
    entity: Y
  ) {
    const catalogEntity = entityCatalog.getEntity<T, Y>(endpointType, entityType) as StratosBaseCatalogEntity<T, Y>;
    if (!catalogEntity) {
      // Only warn for non-endpoint entities. Endpoint lookups (entityType === 'endpoint') may use
      // fallback logic in entityCatalog that searches both the endpoints and entities maps.
      // The entityCatalog.getEntity warning is sufficient for debugging these cases.
      if (entityType !== EntityCatalogHelpers.endpointType) {
        console.warn(
          `User favourite - getFavoriteFromEntity - catalogEntity not found for endpointType=${endpointType}, entityType=${entityType}`
        );
      }
      return null;
    }
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

  public canFavoriteEntityType(entityDefn: StratosBaseCatalogEntity) {
    const defn = entityDefn.builders?.entityBuilder;
    if (defn) {
      const canFavorite = defn.getGuid && defn.getMetadata && defn.getLink;
      return canFavorite;
    }
    return false;
  }
}
