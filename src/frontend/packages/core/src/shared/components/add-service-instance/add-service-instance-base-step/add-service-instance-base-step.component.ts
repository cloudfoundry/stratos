import { query } from '@angular/animations';
import { Component } from '@angular/core';
import { Store } from '@ngrx/store';

import { RouterNav } from '../../../../../../store/src/actions/router.actions';
import { AppState } from '../../../../../../store/src/app-state';
import { TileConfigManager } from '../../tile/tile-selector.helpers';
import { ITileConfig, ITileData } from './../../tile/tile-selector.types';
import { BASE_REDIRECT_QUERY, SERVICE_INSTANCE_TYPES } from './add-service-instance.types';
import { ActivatedRoute, RouterState, Router } from '@angular/router';

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
      { type: SERVICE_INSTANCE_TYPES.SERVICE }
    ),
    this.tileManager.getNextTileConfig<ICreateServiceTilesData>(
      'User Provided Service',
      { matIcon: 'person' },
      { type: SERVICE_INSTANCE_TYPES.USER_SERVICE }
    )
  ];

  private pSelectedTile: ITileConfig<ICreateServiceTilesData>;
  private bindApp: boolean;
  get selectedTile() {
    return this.pSelectedTile;
  }
  set selectedTile(tile: ITileConfig<ICreateServiceTilesData>) {
    this.serviceType = tile ? tile.data.type : null;
    this.pSelectedTile = tile;
    if (tile) {
      const baseUrl = this.bindApp ? this.router.routerState.snapshot.url : '/services/new';
      this.store.dispatch(new RouterNav({
        path: `${baseUrl}/${this.serviceType}`,
        query: {
          [BASE_REDIRECT_QUERY]: baseUrl
        }
      }));
    }
  }
  constructor(private route: ActivatedRoute, private router: Router, public store: Store<AppState>) {
    this.bindApp = !!this.route.snapshot.data.bind;
  }
}
