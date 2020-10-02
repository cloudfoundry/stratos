import { CommonModule } from '@angular/common';
import { NgModule, Optional, SkipSelf } from '@angular/core';
import { Store } from '@ngrx/store';

import { EndpointsService } from '../../../core/src/core/endpoints.service';
import { CoreModule } from '../../../core/src/public-api';
import { SharedModule } from '../../../core/src/shared/shared.module';
import { GetSystemInfo } from '../../../store/src/actions/system.actions';
import { EntityCatalogModule } from '../../../store/src/entity-catalog.module';
import { EndpointHealthCheck } from '../../../store/src/entity-catalog/entity-catalog.types';
import { AppState } from '../../../store/src/public-api';
import { HELM_ENDPOINT_TYPE } from './helm-entity-factory';
import { generateHelmEntities } from './helm-entity-generator';
import { HelmHubRegistrationComponent } from './helm-hub-registration/helm-hub-registration.component';
import { HelmStoreModule } from './helm.store.module';

@NgModule({
  imports: [
    EntityCatalogModule.forFeature(generateHelmEntities),
    CoreModule,
    CommonModule,
    SharedModule,
    HelmStoreModule,
  ],
  declarations: [
    HelmHubRegistrationComponent
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
