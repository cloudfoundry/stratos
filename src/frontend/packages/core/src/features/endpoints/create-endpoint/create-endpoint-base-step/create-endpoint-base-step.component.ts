import { ChangeDetectionStrategy, Component, Injector, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import {
  EndpointsDataService,
  GeneralEntityAppState,
  Store,
  entityCatalog,
} from '@stratosui/store';

import { SessionSignalService } from '../../../../core/signals/session-signal.service';
import { BASE_REDIRECT_QUERY } from '../../../../shared/components/stepper/stepper.types';
import { ITileConfig } from '../../../../shared/components/tile/tile-selector.types';
import { BaseEndpointTileManager, ICreateEndpointTilesData } from './base-endpoint-tile-manager';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { SteppersComponent } from '../../../../shared/components/stepper/steppers/steppers.component';
import { StepComponent, SignalStepHandle } from '../../../../shared/components/stepper/step/step.component';
import { TileSelectorComponent } from '../../../../shared/components/tile-selector/tile-selector.component';


@Component({
  selector: 'app-create-endpoint-base-step',
  templateUrl: './create-endpoint-base-step.component.html',
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

  private router = inject(Router);

  // FWT-956: signal-native step handle. Endpoint-type tile selector is a
  // confirmation-style step (no submission, Next button hidden); navigation
  // happens via the selectedTile setter below.
  signalHandle: SignalStepHandle = { valid: signal(true).asReadonly() };

  set selectedTile(tile: ITileConfig<ICreateEndpointTilesData>) {
    super.selectedTile = tile;
    if (tile) {
      this.router.navigate(
        `endpoints/new/${tile.data.parentType || tile.data.type}/${tile.data.parentType ? tile.data.type : ''}`.split('/'),
        { queryParams: { [BASE_REDIRECT_QUERY]: 'endpoints/new' } }
      );
    }
  }

  constructor() {
    const store = inject<Store<GeneralEntityAppState>>(Store);
    const session = inject(SessionSignalService);

    // Tech-preview flag is sourced from the signal-native session projection;
    // bridged to Observable<StratosCatalogEndpointEntity[]> for the legacy
    // BaseEndpointTileManager constructor signature.
    const types = toObservable(
      computed(() => entityCatalog.getAllEndpointTypes(session.isTechPreview()))
    );
    super(types, store, inject(EndpointsDataService), inject(Injector));
    this.store = store;
  }
}
