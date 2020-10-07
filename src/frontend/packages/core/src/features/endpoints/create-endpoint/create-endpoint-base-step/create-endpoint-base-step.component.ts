import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { combineLatest, filter, first, map } from 'rxjs/operators';

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

type EndpointsByType = {
  [endpointType: string]: number,
};

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
  constructor(public store: Store<GeneralEntityAppState>, ) {
    // Need to filter the endpoint types on the tech preview flag
    this.tileSelectorConfig$ = store.select(selectSessionData()).pipe(
      combineLatest(this.getEndpointTypesByCount(), this.helmHubEnabled()),
      first(),
      map(([sessionData, endpointTypesByCount, helmHubEnabled]) => {
        const techPreviewIsEnabled = sessionData.config.enableTechPreview || false;
        return entityCatalog.getAllEndpointTypes(techPreviewIsEnabled)
          .filter(endpoint => this.filterByEndpointCount(endpoint, endpointTypesByCount))
          .filter(endpoint => this.filterByHelmHub(helmHubEnabled, endpoint))
          .sort((endpointA, endpointB) => this.sortEndpointTiles(endpointA.definition, endpointB.definition))
          .map(catalogEndpoint => {
            const endpoint = catalogEndpoint.definition;
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
      })
    );
  }

  private getEndpointDefinitionKey = (type: string, subType: string): string => type + '_sep_' + subType;
  private getEndpointTypesByCount = (): Observable<EndpointsByType> =>
    stratosEntityCatalog.endpoint.store.getAll.getPaginationService().entities$.pipe(
      filter(endpoints => !!endpoints),
      map(endpoints => {
        const endpointsByType: { [endpointType: string]: number; } = {};
        return endpoints.reduce((res, endpoint) => {
          const type = this.getEndpointDefinitionKey(endpoint.cnsi_type, endpoint.sub_type);
          if (!res[type]) {
            res[type] = 0;
          }
          res[type]++;
          return res;
        }, endpointsByType);
      }),
    );
  private filterByEndpointCount = (endpoint: StratosCatalogEndpointEntity, endpointTypesByCount: EndpointsByType) => {
    // No limit applied, always show endpoint
    if (typeof endpoint.definition.registeredLimit !== 'number') {
      return true;
    }
    // Zero limit, never show endpoint
    if (endpoint.definition.registeredLimit === 0) {
      return false;
    }

    // Check that the limit is not exceeded by endpoints already registered
    const type = endpoint.definition.parentType ?
      this.getEndpointDefinitionKey(endpoint.definition.parentType, endpoint.definition.type) :
      this.getEndpointDefinitionKey(endpoint.definition.type, '');
    const count = endpointTypesByCount[type] || 0;
    return count < endpoint.definition.registeredLimit;
  };

  private helmHubEnabled = () => {
    return this.store.select('auth').pipe(
      filter(auth => !!auth.sessionData['plugin-config']),
      map(auth => auth.sessionData['plugin-config'].helmHubEnabled)
    );
  };
  private filterByHelmHub(helmHubEnabled: string, endpoint: StratosCatalogEndpointEntity): boolean {
    return helmHubEnabled === 'true' ? true : !(endpoint.definition.parentType === 'helm' && endpoint.definition.type === 'hub');
  }

}
