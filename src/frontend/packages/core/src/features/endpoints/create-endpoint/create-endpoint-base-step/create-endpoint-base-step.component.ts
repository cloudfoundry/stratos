import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { SteppersComponent } from '../../../../shared/components/stepper/steppers/steppers.component';
import { StepComponent } from '../../../../shared/components/stepper/step/step.component';
import { TileSelectorComponent } from '../../../../shared/components/tile-selector/tile-selector.component';


@Component({
  selector: 'app-create-endpoint-base-step',
  templateUrl: './create-endpoint-base-step.component.html',
  styleUrls: ['./create-endpoint-base-step.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent,
    SteppersComponent,
    StepComponent,
    TileSelectorComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
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

  constructor() {
    const store = inject<Store<GeneralEntityAppState>>(Store);

    const types = store.select(selectSessionData()).pipe(
      // Get a list of all known endpoint types
      map(sessionData => entityCatalog.getAllEndpointTypes(sessionData.config.enableTechPreview || false))
    );
    super(types, store);
    this.store = store;
  }
}
