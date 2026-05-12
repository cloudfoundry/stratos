import { CommonModule } from '@angular/common';
import { NgModule, inject } from '@angular/core';

import { EndpointsService } from '../../../core/src/core/endpoints.service';
import { CoreModule } from '../../../core/src/public-api';
import { SharedModule } from '@stratosui/core';
import { GetSystemInfo } from '../../../store/src/actions/system.actions';
import { EntityCatalogModule } from '../../../store/src/entity-catalog.module';
import { EndpointHealthCheck } from '../../../store/src/entity-catalog/entity-catalog.types';
import { AppState, Store } from '../../../store/src/public-api';
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
    HelmHubRegistrationComponent
  ]
})
export class HelmSetupModule {
  constructor() {
    const endpointService = inject(EndpointsService);
    const store = inject<Store<AppState>>(Store);
    const parentModule = inject(HelmSetupModule, { optional: true, skipSelf: true });

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
