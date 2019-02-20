import { ITileConfig, ITileData } from './../../tile/tile-selector.types';
import { Component } from '@angular/core';
import { TileConfigManager } from '../../tile/tile-selector.helpers';
import { of, Observable } from 'rxjs';
import { StepOnNextResult } from '../../stepper/step/step.component';
import { SERVICE_INSTANCE_TYPES } from './add-service-instance.types';
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
      'Service',
      { type: SERVICE_INSTANCE_TYPES.SERVICE }
    ),
    this.tileManager.getNextTileConfig<ICreateServiceTilesData>(
      'User Provided Service',
      { type: SERVICE_INSTANCE_TYPES.USER_SERVICE }
    )
  ];

  public _selectedTile: ITileConfig<ICreateServiceTilesData>;
  set selectedTile(tile: ITileConfig<ICreateServiceTilesData>) {
    this.serviceType = tile.data.type;
    this._selectedTile = tile;
  }

  public next = (): Observable<StepOnNextResult> => {
    return of({
      success: true,
      redirect: true,
      redirectPayload: {
        path: `/services/new/${this.serviceType}`
      }
    });
  }
  constructor() { }
}
