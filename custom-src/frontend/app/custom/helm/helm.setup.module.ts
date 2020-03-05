import { CommonModule } from '@angular/common';
import { NgModule, Optional, SkipSelf } from '@angular/core';
import { Store } from '@ngrx/store';

import { GetSystemInfo } from '../../../../store/src/actions/system.actions';
import { AppState } from '../../../../store/src/app-state';
import { EntityCatalogModule } from '../../../../store/src/entity-catalog.module';
import { EndpointHealthCheck } from '../../../endpoints-health-checks';
import { CoreModule } from '../../core/core.module';
import { EndpointsService } from '../../core/endpoints.service';
import { SharedModule } from '../../shared/shared.module';
import { HELM_ENDPOINT_TYPE } from './helm-entity-factory';
import { generateHelmEntities } from './helm-entity-generator';
import { HelmStoreModule } from './helm.store.module';

@NgModule({
  imports: [
    EntityCatalogModule.forFeature(generateHelmEntities),
    CoreModule,
    CommonModule,
    SharedModule,
    HelmStoreModule,
  ]
})
export class HelmSetupModule {
  constructor(
    endpointService: EndpointsService,
    store: Store<AppState>,
    @Optional() @SkipSelf() parentModule: HelmSetupModule
  ) {
    if (parentModule) {
      // Module has already been imported
    } else {
      endpointService.registerHealthCheck(
        new EndpointHealthCheck(HELM_ENDPOINT_TYPE, (endpoint) => {
          if (endpoint.endpoint_metadata && endpoint.endpoint_metadata.status === 'Synchronizing') {
            store.dispatch(new GetSystemInfo());
          }
        })
      );
    }

  }
}
