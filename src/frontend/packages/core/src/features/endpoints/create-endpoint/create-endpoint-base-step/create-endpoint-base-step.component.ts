import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { first, map } from 'rxjs/operators';

import { RouterNav } from '../../../../../../store/src/actions/router.actions';
import { GeneralEntityAppState } from '../../../../../../store/src/app-state';
import { selectSessionData } from '../../../../../../store/src/reducers/auth.reducer';
import { entityCatalog } from '../../../../../../store/src/entity-catalog/entity-catalog';
import { BASE_REDIRECT_QUERY } from '../../../../shared/components/stepper/stepper.types';
import { TileConfigManager } from '../../../../shared/components/tile/tile-selector.helpers';
import { ITileConfig, ITileData } from '../../../../shared/components/tile/tile-selector.types';
import { Observable } from 'rxjs';
import { IStratosEndpointDefinition } from '../../../../../../store/src/entity-catalog/entity-catalog.types';

interface ICreateEndpointTilesData extends ITileData {
  type: string;
  parentType: string;
}

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
  }

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
      first(),
      map(sessionData => {
        const techPreviewIsEnabled = sessionData.config.enableTechPreview || false;
        return entityCatalog.getAllEndpointTypes(techPreviewIsEnabled)
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
                parentType: endpoint.parentType
              }
            );
          });
      })
    );
  }

}
