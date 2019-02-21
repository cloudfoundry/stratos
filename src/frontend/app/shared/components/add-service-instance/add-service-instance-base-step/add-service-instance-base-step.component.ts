import { AppState } from './../../../../store/app-state';
import { query } from '@angular/animations';
import { ITileConfig, ITileData } from './../../tile/tile-selector.types';
import { Component } from '@angular/core';
import { TileConfigManager } from '../../tile/tile-selector.helpers';
import { of, Observable } from 'rxjs';
import { StepOnNextResult } from '../../stepper/step/step.component';
import { SERVICE_INSTANCE_TYPES, BASE_REDIRECT_QUERY } from './add-service-instance.types';
import { Store } from '@ngrx/store';
import { RouterNav } from '../../../../store/actions/router.actions';
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
