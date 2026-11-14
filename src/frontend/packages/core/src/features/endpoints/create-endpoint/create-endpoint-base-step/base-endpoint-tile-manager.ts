import { combineLatest, Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { computed, Injector, Signal } from '@angular/core';
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

/**
 * The tile selector's `(selection)` output is typed with the base ITileData
 * shape (and emits null on deselect). Tiles built by BaseEndpointTileManager
 * always carry the create-endpoint data, so narrow with a runtime check.
 */
export function isCreateEndpointTile(
  tile: ITileConfig | null
): tile is ITileConfig<ICreateEndpointTilesData> {
  return !!tile && !!tile.data && typeof tile.data.type === 'string' && typeof tile.data.parentType === 'string';
}
type ExpandedEndpoint = {
  current: number,
  limit: number;
  definition: IStratosEndpointDefinition;
};

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

  public tileSelectorConfig: Signal<ITileConfig<ICreateEndpointTilesData>[]>;

  // strict: write-only selection model — only ever assigned via the
  // selectedTile setter (which navigates) and never read back before that.
  protected pSelectedTile!: ITileConfig<ICreateEndpointTilesData>;

  get selectedTile() {
    return this.pSelectedTile;
  }
  set selectedTile(tile: ITileConfig<ICreateEndpointTilesData>) {
    this.pSelectedTile = tile;
  }

  protected sortEndpointTiles(
    { label: aLabel = '', renderPriority: aRenderPriority }: IStratosEndpointDefinition,
    { label: bLabel = '', renderPriority: bRenderPriority }: IStratosEndpointDefinition
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
    types: Signal<StratosCatalogEndpointEntity[]>,
    endpointsData?: EndpointsDataService,
    injector?: Injector,
  ) {
    // W36-B Wave 3: source endpoints from EndpointsDataService. The Injector
    // is required to keep the limit streams inside an injection context.
    if (!endpointsData || !injector) {
      throw new Error('BaseEndpointTileManager requires EndpointsDataService + Injector — supply them via the subclass super() call.');
    }
    this.endpointsData = endpointsData;
    this.injector = injector;
    this.tileManager = new TileConfigManager();

    // A type's limit may be a stream (it can wait on the session), so the
    // limits are the one RxJS part. A change of types drops the old limit
    // watchers; no tiles until every limit is known.
    const limited = toSignal(
      toObservable(types, { injector }).pipe(
        switchMap(entities => entities.length
          ? combineLatest(entities.map(entity => this.getEndpointRegisteredLimit(entity).pipe(
            map(limit => ({ entity, limit }))
          )))
          : of([])
        )
      ),
      { injector, initialValue: [] }
    );
    const expanded = computed<ExpandedEndpoint[]>(() => {
      const endpoints = endpointsData.endpointsList();
      return limited().map(({ entity, limit }) => {
        const { type, subType } = entity.getTypeAndSubtype();
        return {
          current: endpoints.filter(em => em.cnsi_type === type && (em.sub_type || null) === subType).length,
          limit,
          definition: entity.definition
        };
      });
    });
    // The endpoints list changes often (status checks); the tiles only when
    // the offered types do, so the selector keeps its tiles otherwise.
    const sameTiles = (a: ITileConfig<ICreateEndpointTilesData>[], b: ITileConfig<ICreateEndpointTilesData>[]) =>
      a.length === b.length && a.every((tile, i) => tile.data?.type === b[i].data?.type && tile.data?.parentType === b[i].data?.parentType);
    this.tileSelectorConfig = computed(() => expanded()
      // Remove any that are over the types limit
      .filter(expandedEndpointType => this.filterByEndpointCount(expandedEndpointType))
      .sort((endpointA, endpointB) => this.sortEndpointTiles(endpointA.definition, endpointB.definition))
      // Map into tile format
      .map(expandedEndpointType => {
        const endpoint = expandedEndpointType.definition;
        return this.tileManager.getNextTileConfig<ICreateEndpointTilesData>(
          endpoint.label ?? endpoint.type ?? '',
          endpoint.logoUrl ? {
            location: endpoint.logoUrl
          } : {
              matIcon: endpoint.icon ?? '',
              matIconFont: endpoint.iconFont
            },
          {
            type: endpoint.type ?? '',
            parentType: endpoint.parentType ?? '',
            component: endpoint.registrationComponent }
        );
      }), { equal: sameTiles });
  }

  private getEndpointRegisteredLimit(endpoint: StratosCatalogEndpointEntity): Observable<number> {
    const registeredLimit = endpoint.definition.registeredLimit;
    if (!registeredLimit) {
      return of(Number.MAX_SAFE_INTEGER);
    }
    // registeredLimit is typed as a factory function; it returns either a
    // raw number or an Observable<number>, both handled below.
    const res = registeredLimit(this.injector!);
    return typeof res === 'number' ? of(res) : res;
  }

  private filterByEndpointCount(endpointType: ExpandedEndpoint): boolean {
    // Check that the limit is not exceeded by endpoints already registered
    return endpointType.current < endpointType.limit;
  }
}
