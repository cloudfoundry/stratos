import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, Observable, of } from 'rxjs';
import { filter, first, map, switchMap } from 'rxjs/operators';

import { RouterNav } from '../../../../../../store/src/actions/router.actions';
import { GeneralEntityAppState } from '../../../../../../store/src/app-state';
import { entityCatalog } from '../../../../../../store/src/entity-catalog/entity-catalog';
import {
  StratosCatalogEndpointEntity,
} from '../../../../../../store/src/entity-catalog/entity-catalog-entity/entity-catalog-entity';
import { IStratosEndpointDefinition } from '../../../../../../store/src/entity-catalog/entity-catalog.types';
import { selectSessionData } from '../../../../../../store/src/reducers/auth.reducer';
import { stratosEntityCatalog } from '../../../../../../store/src/stratos-entity-catalog';
import { BASE_REDIRECT_QUERY } from '../../../../shared/components/stepper/stepper.types';
import { TileConfigManager } from '../../../../shared/components/tile/tile-selector.helpers';
import { ITileConfig, ITileData } from '../../../../shared/components/tile/tile-selector.types';

interface ICreateEndpointTilesData extends ITileData {
  type: string;
  parentType: string;
}

type ExpandedEndpoint<T = number> = {
  current: number,
  limit: T;
  definition: IStratosEndpointDefinition;
};

type ExpandedEndpoints<T = number> = ExpandedEndpoint<T>[];

@Component({
  selector: 'app-create-endpoint-base-step',
  templateUrl: './create-endpoint-base-step.component.html',
  styleUrls: ['./create-endpoint-base-step.component.scss']
})
export class CreateEndpointBaseStepComponent {

  private tileManager = new TileConfigManager();

  public tileSelectorConfig$: Observable<ITileConfig<ICreateEndpointTilesData>[]>;

  private pSelectedTile: ITileConfig<ICreateEndpointTilesData>;

  private sortEndpointTiles = (
    { label: aLabel, renderPriority: aRenderPriority }: IStratosEndpointDefinition,
    { label: bLabel, renderPriority: bRenderPriority }: IStratosEndpointDefinition
  ) => {
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
  };

  get selectedTile() {
    return this.pSelectedTile;
  }
  set selectedTile(tile: ITileConfig<ICreateEndpointTilesData>) {
    this.pSelectedTile = tile;
    if (tile) {
      this.store.dispatch(new RouterNav({
        path: `endpoints/new/${tile.data.parentType || tile.data.type}/${tile.data.parentType ? tile.data.type : ''}`,
        query: {
          [BASE_REDIRECT_QUERY]: 'endpoints/new'
        }
      }));
    }
  }
  constructor(public store: Store<GeneralEntityAppState>) {
    // Need to filter the endpoint types on the tech preview flag
    this.tileSelectorConfig$ = store.select(selectSessionData()).pipe(
      // Get a list of all known endpoint types
      map(sessionData => entityCatalog.getAllEndpointTypes(sessionData.config.enableTechPreview || false)),
      // Add additional metadata to each endpoint type
      switchMap(endpointTypes => this.expandEndpointTypes(endpointTypes)),
      first(),
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
                component: endpoint.registrationComponent,
              }
            );
          });
      }),
    );
  }

  private expandEndpointTypes = (endpointEntities: StratosCatalogEndpointEntity[]): Observable<ExpandedEndpoints> =>
    stratosEntityCatalog.endpoint.store.getAll.getPaginationService().entities$.pipe(
      filter(endpoints => !!endpoints),
      map(endpoints => {
        const endpointsByType: ExpandedEndpoints<Observable<number>> = [];
        return endpointEntities.reduce((res, endpointEntity) => {
          const { type: endpointType, subType: endpointSubType } = endpointEntity.getTypeAndSubtype();
          res.push({
            current: endpoints.filter(em => em.cnsi_type === endpointType && em.sub_type === endpointSubType).length,
            limit: this.getEndpointRegisteredLimit(endpointEntity),
            definition: endpointEntity.definition
          });
          return res;
        }, endpointsByType);
      }),
      switchMap(endpointsByType => combineLatest(Object.values(endpointsByType).map(type => type.limit.pipe(
        map(limit => ({
          ...type,
          limit
        }))
      )))),
    );

  private getEndpointRegisteredLimit(endpoint: StratosCatalogEndpointEntity): Observable<number> {
    const registeredLimit = endpoint.definition.registeredLimit;
    if (!registeredLimit) {
      return of(Number.MAX_SAFE_INTEGER);
    }
    if (typeof registeredLimit === 'number') {
      return of(registeredLimit);
    }
    const res = registeredLimit(this.store);
    return typeof res === 'number' ? of(res) : res;
  }
  private filterByEndpointCount = (endpointType: ExpandedEndpoint): boolean => {
    // Check that the limit is not exceeded by endpoints already registered
    return endpointType.current < endpointType.limit;
  };

}
