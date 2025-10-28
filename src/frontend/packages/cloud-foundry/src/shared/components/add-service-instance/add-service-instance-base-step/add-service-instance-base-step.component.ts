import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';

import { CFAppState } from '../../../../../../cloud-foundry/src/cf-app-state';
import { getIdFromRoute } from '../../../../../../core/src/core/utils.service';
import { BASE_REDIRECT_QUERY } from '../../../../../../core/src/shared/components/stepper/stepper.types';
import { TileConfigManager } from '../../../../../../core/src/shared/components/tile/tile-selector.helpers';
import { ITileConfig, ITileData } from '../../../../../../core/src/shared/components/tile/tile-selector.types';
import { RouterNav } from '../../../../../../store/src/actions/router.actions';
import { CSI_CANCEL_URL } from '../csi-mode.service';
import { SERVICE_INSTANCE_TYPES } from './add-service-instance.types';
import { PageHeaderComponent } from '../../../../../../core/src/shared/components/page-header/page-header.component';
import { SteppersComponent } from '../../../../../../core/src/shared/components/stepper/steppers/steppers.component';
import { StepComponent } from '../../../../../../core/src/shared/components/stepper/step/step.component';
import { TileSelectorComponent } from '../../../../../../core/src/shared/components/tile-selector/tile-selector.component';

interface ICreateServiceTilesData extends ITileData {
  type: string;
}

@Component({
  selector: 'app-add-service-instance-base-step',
  templateUrl: './add-service-instance-base-step.component.html',
  styleUrls: ['./add-service-instance-base-step.component.scss'],
  standalone: true,
  imports: [
    PageHeaderComponent,
    SteppersComponent,
    StepComponent,
    TileSelectorComponent
  ]
})
export class AddServiceInstanceBaseStepComponent {
  private tileManager = new TileConfigManager();
  public serviceType: string;
  public cancelUrl = '/services';

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
  public bindApp: boolean;
  get selectedTile() {
    return this.pSelectedTile;
  }
  set selectedTile(tile: ITileConfig<ICreateServiceTilesData>) {
    this.serviceType = tile ? tile.data.type : null;
    this.pSelectedTile = tile;
    if (tile) {
      const baseUrl = this.createServiceTileUrl();
      this.store.dispatch(new RouterNav({
        path: `${baseUrl}/${this.serviceType}`,
        query: {
          [BASE_REDIRECT_QUERY]: baseUrl, // 'previous' destination
          [CSI_CANCEL_URL]: this.cancelUrl // 'cancel' + 'success' destination
        }
      }));
    }
  }

  private cfId: string;
  private appId: string;

  constructor(
    private route: ActivatedRoute,
    public store: Store<CFAppState>
  ) {
    this.bindApp = !!this.route.snapshot.data.bind;
    if (this.bindApp) {
      this.cfId = getIdFromRoute(this.route, 'endpointId');
      this.appId = getIdFromRoute(this.route, 'id');
    }
    this.cancelUrl = this.createCancelUrl();
  }

  private createServiceTileUrl(): string {
    return this.bindApp ? `/applications/${this.cfId}/${this.appId}/bind` : '/services/new';
  }

  private createCancelUrl(): string {
    return this.bindApp ? `/applications/${this.cfId}/${this.appId}/services` : '/services';
  }


}
