import { Component } from '@angular/core';
import { Store } from '@ngrx/store';

import { RouterNav } from '../../../../../../store/src/actions/router.actions';
import { GeneralEntityAppState } from '../../../../../../store/src/app-state';
import { BASE_REDIRECT_QUERY } from '../../../../shared/components/stepper/stepper.types';
import { TileConfigManager } from '../../../../shared/components/tile/tile-selector.helpers';
import { ITileConfig, ITileData } from '../../../../shared/components/tile/tile-selector.types';
import { entityCatalogue } from '../../../../core/entity-catalogue/entity-catalogue.service';

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

  public tileSelectorConfig: ITileConfig<ICreateEndpointTilesData>[];

  private pSelectedTile: ITileConfig<ICreateEndpointTilesData>;
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
    this.tileSelectorConfig = entityCatalogue.getAllEndpointTypes().map(catalogueEndpoint => {
      const endpoint = catalogueEndpoint.definition;
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
  }

}
