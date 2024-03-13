import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  RouterNav,
  GeneralEntityAppState,
  entityCatalog,
  selectSessionData,
} from '@stratosui/store';
import { map } from 'rxjs/operators';

import { BASE_REDIRECT_QUERY } from '../../../../shared/components/stepper/stepper.types';
import { ITileConfig } from '../../../../shared/components/tile/tile-selector.types';
import { BaseEndpointTileManager, ICreateEndpointTilesData } from './base-endpoint-tile-manager';


@Component({
  selector: 'app-create-endpoint-base-step',
  templateUrl: './create-endpoint-base-step.component.html',
  styleUrls: ['./create-endpoint-base-step.component.scss']
})
export class CreateEndpointBaseStepComponent extends BaseEndpointTileManager {

  set selectedTile(tile: ITileConfig<ICreateEndpointTilesData>) {
    super.selectedTile = tile;
    if (tile) {
      this.store.dispatch(new RouterNav({
        path: `endpoints/new/${tile.data.parentType || tile.data.type}/${tile.data.parentType ? tile.data.type : ''}`,
        query: {
          [BASE_REDIRECT_QUERY]: 'endpoints/new'
        }
      }));
    }
  }

  constructor(store: Store<GeneralEntityAppState>) {
    const types = store.select(selectSessionData()).pipe(
      // Get a list of all known endpoint types
      map(sessionData => entityCatalog.getAllEndpointTypes(sessionData.config.enableTechPreview || false))
    );
    super(types, store);
    this.store = store;
  }
}
