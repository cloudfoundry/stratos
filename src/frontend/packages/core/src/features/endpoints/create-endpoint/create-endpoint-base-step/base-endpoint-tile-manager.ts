import { combineLatest, Observable, of } from 'rxjs';
import { take, filter, map, switchMap } from 'rxjs/operators';
import { toObservable } from '@angular/core/rxjs-interop';
import { Injector } from '@angular/core';
import {
  EndpointsDataService,
  IStratosEndpointDefinition,
  StratosCatalogEndpointEntity,
} from '@stratosui/store';

import { TileConfigManager } from '../../../../shared/components/tile/tile-selector.helpers';
import { ITileConfig, ITileData } from '../../../../shared/components/tile/tile-selector.types';

export interface ICreateEndpointTilesData extends ITileData {
  type: string;
  parentType: string;
}
type ExpandedEndpoint<T = number> = {
  current: number,
  limit: T;
  definition: IStratosEndpointDefinition;
};

type ExpandedEndpoints<T = number> = ExpandedEndpoint<T>[];

/**
 * Provides set of endpoint tiles that can power an `app-tile-selector` component
 * Handles sorting, hiding, filtering, etc
 */
export abstract class BaseEndpointTileManager {
  // W36-B Wave 3: optional EndpointsDataService + Injector. When
  // supplied, the tile-population pipeline reads endpoints from the
  // signal-native service instead of the legacy ngrx pagination
  // service. Subclass `super()` calls must thread these through.
  protected endpointsData?: EndpointsDataService;
  protected injector?: Injector;

  private tileManager: TileConfigManager;

  public tileSelectorConfig$: Observable<ITileConfig<ICreateEndpointTilesData>[]>;

  protected pSelectedTile: ITileConfig<ICreateEndpointTilesData>;

  get selectedTile() {
    return this.pSelectedTile;
  }
  set selectedTile(tile: ITileConfig<ICreateEndpointTilesData>) {
    this.pSelectedTile = tile;
  }

  protected sortEndpointTiles(
    { label: aLabel, renderPriority: aRenderPriority }: IStratosEndpointDefinition,
    { label: bLabel, renderPriority: bRenderPriority }: IStratosEndpointDefinition
  ) {
    // We're going to do a little more work than just to compare the render priority to ensure
    // the tile order is as consistent and sensible as possible across browsers in order to provide the best UX.
    // If we were to just rely on render priority and two or more endpoints were the same
    // then there would be no guarantee on their order being the same over different browsers or
    // possibly over browser refreshes.
    const aIsNumber = typeof aRenderPriority === 'number';
    const bIsNumber = typeof bRenderPriority === 'number';
    if (aIsNumber && bIsNumber) {
      // If the endpoint have render priorities then compare them.
      if (aRenderPriority > bRenderPriority) {
        return 1;
      }
      if (bRenderPriority > aRenderPriority) {
        return -1;
      }
      // If the render priorities are equal, try to distinguish them via label.
    }
    // If only endpoint A has a render priority or a.label > b.label then a is greater.
    if (
      (aIsNumber && !bIsNumber) ||
      (aLabel > bLabel)
    ) {
      return 1;
    }
    // If only endpoint B has a render priority or b.label > a.label then B is greater.
    if (
      (bIsNumber && !aIsNumber) ||
      (bLabel > aLabel)
    ) {
      return -1;
    }
    // Both A & B are equal. Unlikely.
    return 0;
  }

  constructor(
    types$: Observable<StratosCatalogEndpointEntity[]>,
    endpointsData?: EndpointsDataService,
    injector?: Injector,
  ) {
    this.endpointsData = endpointsData;
    this.injector = injector;
    this.tileManager = new TileConfigManager();
    // Need to filter the endpoint types on the tech preview flag
    this.tileSelectorConfig$ = types$.pipe(
      // Add additional metadata to each endpoint type
      switchMap(endpointTypes => this.expandEndpointTypes(endpointTypes)),
      take(1),
      map(expandedEndpointTypes => {
        // For each endpoint type...
        return expandedEndpointTypes
          // .. remove any that are over the types limit
          .filter(expandedEndpointType => this.filterByEndpointCount(expandedEndpointType))
          // .. sort
          .sort((endpointA, endpointB) => this.sortEndpointTiles(endpointA.definition, endpointB.definition))
          // .. map into tile format
          .map(expandedEndpointType => {
            const endpoint = expandedEndpointType.definition;
            return this.tileManager.getNextTileConfig<ICreateEndpointTilesData>(
              endpoint.label,
              endpoint.logoUrl ? {
                location: endpoint.logoUrl
              } : {
                  matIcon: endpoint.icon,
                  matIconFont: endpoint.iconFont
                },
              {
                type: endpoint.type,
                parentType: endpoint.parentType,
                component: endpoint.registrationComponent }
            );
          });
      }),
    );
  }

  protected expandEndpointTypes(endpointEntities: StratosCatalogEndpointEntity[]): Observable<ExpandedEndpoints> {
    // W36-B Wave 3: source endpoints from EndpointsDataService when
    // available. Subclasses created before this wave were
    // single-instance per page; the service is providedIn: 'root', so
    // any caller can access it. The Injector is required to keep
    // toObservable() inside an injection context.
    if (!this.endpointsData || !this.injector) {
      throw new Error('BaseEndpointTileManager requires EndpointsDataService + Injector — supply them via the subclass super() call.');
    }
    return toObservable(this.endpointsData.endpointsList, { injector: this.injector }).pipe(
      filter(endpoints => !!endpoints),
      map(endpoints => {
        const endpointsByType: ExpandedEndpoints<Observable<number>> = [];
        return endpointEntities.reduce((res: ExpandedEndpoints<Observable<number>>, endpointEntity: StratosCatalogEndpointEntity) => {
          const { type: endpointType, subType: endpointSubType } = endpointEntity.getTypeAndSubtype();
          res.push({
            current: endpoints.filter(em => em.cnsi_type === endpointType && em.sub_type === endpointSubType).length,
            limit: this.getEndpointRegisteredLimit(endpointEntity),
            definition: endpointEntity.definition
          });
          return res;
        }, endpointsByType);
      }),
      switchMap(endpointsByType => combineLatest(Object.values(endpointsByType).map((type: ExpandedEndpoint<Observable<number>>) => type.limit.pipe(
        map((limit: number) => ({
          ...type,
          limit
        }))
      )))),
    );
  }

  private getEndpointRegisteredLimit(endpoint: StratosCatalogEndpointEntity): Observable<number> {
    const registeredLimit = endpoint.definition.registeredLimit;
    if (!registeredLimit) {
      return of(Number.MAX_SAFE_INTEGER);
    }
    if (typeof registeredLimit === 'number') {
      return of(registeredLimit);
    }
    // `injector` is guaranteed set here: expandEndpointTypes() throws
    // without it before any tile (and thus any limit) is evaluated.
    const res = registeredLimit(this.injector!);
    return typeof res === 'number' ? of(res) : res;
  }

  private filterByEndpointCount(endpointType: ExpandedEndpoint): boolean {
    // Check that the limit is not exceeded by endpoints already registered
    return endpointType.current < endpointType.limit;
  }
}
