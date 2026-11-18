import { computed, inject, Injectable, Signal } from '@angular/core';

import { IRequestEntityTypeState } from './app-state';
import { StratosBaseCatalogEntity } from './entity-catalog/entity-catalog-entity/entity-catalog-entity';
import { EntityCatalogHelpers } from './entity-catalog/entity-catalog.helper';
import { IEntityMetadata, IStratosEntityDefinition } from './entity-catalog/entity-catalog.types';
import { EndpointModel, entityCatalog } from './public-api';
import { UserFavoritesDataService } from './services/user-favorites-data.service';
import { IUserFavoritesGroups } from './types/favorite-groups.types';
import {
  IFavoriteMetadata,
  IFavoriteTypeInfo,
  UserFavorite,
  UserFavoriteEndpoint,
} from './types/user-favorites.types';


@Injectable({
  providedIn: 'root'
})
export class UserFavoriteManager {
  private userFavorites = inject(UserFavoritesDataService);

  // The flat favorites map as a `{ [guid]: UserFavorite }` record.
  private readonly favoriteEntities = computed(
    () => Object.fromEntries(this.userFavorites.favorites()) as IRequestEntityTypeState<UserFavorite<IFavoriteMetadata>>
  );

  /**
   * The favorite groups and the flat favorites record. Undefined while the
   * favorites load, and after a failed load.
   */
  readonly allFavorites: Signal<[IUserFavoritesGroups, IRequestEntityTypeState<UserFavorite<IFavoriteMetadata>>] | undefined> =
    computed(() => {
      if (this.userFavorites.fetching() || this.userFavorites.error()) {
        return undefined;
      }
      return [this.userFavorites.groups(), this.favoriteEntities()];
    });

  /**
   * Row keys (`endpointId:entityId`) of the starred entities of the given
   * types on the given endpoint type. Empty until the favorites have loaded.
   * Reads signals, so it updates when called inside a reactive context.
   */
  public entityFavoriteKeys(endpointType: string, entityTypes: string[]): Set<string> {
    const out = new Set<string>();
    const all = this.allFavorites();
    if (!all) {
      return out;
    }
    const [groups, entities] = all;
    for (const endpointFavGuid in groups) {
      for (const favId of groups[endpointFavGuid]?.entitiesIds ?? []) {
        const fav = entities[favId];
        if (fav && fav.endpointType === endpointType && entityTypes.includes(fav.entityType)) {
          out.add(`${fav.endpointId}:${fav.entityId}`);
        }
      }
    }
    return out;
  }

  /** Whether the favorite is starred. Reads a signal, so it is reactive. */
  public isFavorite(favorite: UserFavorite<IFavoriteMetadata>): boolean {
    return !!favorite && this.userFavorites.favorites().has(favorite.guid);
  }

  /**
   * The starred entities of one endpoint. Undefined until the favorites have
   * loaded.
   */
  public favoritesForEndpoint(endpointID: string): Signal<UserFavorite<IFavoriteMetadata>[] | undefined> {
    return computed(() => {
      const all = this.allFavorites();
      if (!all) {
        return undefined;
      }
      const result: UserFavorite<IFavoriteMetadata>[] = [];
      Object.values(all[1]).forEach(f => {
        if (f.endpointId === endpointID && f.entityId) {
          // Ensure we actually have a UserFavorite object and not a struct
          const userFavorite = this.getUserFavoriteFromObject(f);
          if (userFavorite) {
            result.push(userFavorite);
          }
        }
      });
      return result;
    });
  }

  public getUserFavoriteFromObject = <T extends IFavoriteMetadata = IFavoriteMetadata>(f: IFavoriteTypeInfo<T>): UserFavorite<T> | null => {
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

  public toggleFavorite(favorite: UserFavorite<IFavoriteMetadata>) {
    // Defensive: Validate favorite before toggling
    if (!favorite) {
      console.error('User favorites: toggleFavorite - favorite is null or undefined');
      return;
    }

    this.userFavorites.toggle(favorite);
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
    // through the favorites store anyway). The same applies to a missing
    // endpoint/entity type.
    if (!endpointId || !endpointType || !entityType) {
      return null;
    }
    return new UserFavorite<T>(
      endpointId,
      endpointType,
      entityType,
      // Endpoint favorites carry no entityId (guid is intentionally null here).
      guid ?? undefined,
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
  ): UserFavoriteEndpoint | null {
    if (!endpoint.cnsi_type || !endpoint.guid) {
      return null;
    }
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
        const canFavorite = !!defn.getGuid && !!defn.getMetadata && !!defn.getLink;
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
      const canFavorite = !!defn.getGuid && !!defn.getMetadata && !!defn.getLink;
      return canFavorite;
    }
    return false;
  }
}
