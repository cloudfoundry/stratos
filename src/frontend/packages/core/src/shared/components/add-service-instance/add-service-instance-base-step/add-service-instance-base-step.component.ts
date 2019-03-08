import { query } from '@angular/animations';
import { Component } from '@angular/core';
import { Store } from '@ngrx/store';

import { RouterNav } from '../../../../../../store/src/actions/router.actions';
import { AppState } from '../../../../../../store/src/app-state';
import { TileConfigManager } from '../../tile/tile-selector.helpers';
import { ITileConfig, ITileData } from './../../tile/tile-selector.types';
import { BASE_REDIRECT_QUERY, SERVICE_INSTANCE_TYPES } from './add-service-instance.types';

interface ICreateServiceTilesData extends ITileData {
  type: string;
}

@Component({
  selector: 'app-add-service-instance-base-step',
  templateUrl: './add-service-instance-base-step.component.html',
  styleUrls: ['./add-service-instance-base-step.component.scss']
})
export class AddServiceInstanceBaseStepComponent {
  private tileManager = new TileConfigManager();
  public serviceType: string;

  public tileSelectorConfig = [
    this.tileManager.getNextTileConfig<ICreateServiceTilesData>(
      'Marketplace Service',
      { matIcon: 'store' },
      // { matIcon: 'service', matIconFont: 'stratos-icons' },
      { type: SERVICE_INSTANCE_TYPES.SERVICE }
    ),
    this.tileManager.getNextTileConfig<ICreateServiceTilesData>(
      'User Provided Service',
      { matIcon: 'person' },
      { type: SERVICE_INSTANCE_TYPES.USER_SERVICE }
    )
  ];

  private _selectedTile: ITileConfig<ICreateServiceTilesData>;
  get selectedTile() {
    return this._selectedTile;
  }
  set selectedTile(tile: ITileConfig<ICreateServiceTilesData>) {
    this.serviceType = tile ? tile.data.type : null;
    this._selectedTile = tile;
    if (tile) {
      this.store.dispatch(new RouterNav({
        path: `/services/new/${this.serviceType}`,
        query: {
          [BASE_REDIRECT_QUERY]: true
        }
      }));
    }
  }
  constructor(public store: Store<AppState>) { }
}
