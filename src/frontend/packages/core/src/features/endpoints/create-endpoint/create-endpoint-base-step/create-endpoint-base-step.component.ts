import { Component } from '@angular/core';
import { Store } from '@ngrx/store';

import { RouterNav } from '../../../../../../store/src/actions/router.actions';
import { AppState } from '../../../../../../store/src/app-state';
import { BASE_REDIRECT_QUERY } from '../../../../shared/components/stepper/stepper.types';
import { TileConfigManager } from '../../../../shared/components/tile/tile-selector.helpers';
import { ITileConfig, ITileData } from '../../../../shared/components/tile/tile-selector.types';
import { getEndpointTypes } from '../../endpoint-helpers';

interface ICreateEndpointTilesData extends ITileData {
  type: string;
  subType: string;
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
        path: `endpoints/new/${tile.data.type}/${tile.data.subType || ''}`,
        query: {
          [BASE_REDIRECT_QUERY]: 'endpoints/new'
        }
      }));
    }
  }
  constructor(public store: Store<AppState>) {
    this.tileSelectorConfig = getEndpointTypes().map(et => {
      return this.tileManager.getNextTileConfig<ICreateEndpointTilesData>(
        et.label,
        et.imagePath ? {
          location: et.imagePath
        } : {
            matIcon: et.icon,
            matIconFont: et.iconFont
          },
        {
          type: et.type,
          subType: et.subType
        }
      );
    });
  }

}
