import { CommonModule } from '@angular/common';
import { Injector, NgModule, inject } from '@angular/core';

import { MDAppModule } from '../../core/src/core/md.module';
import { SharedModule } from '@stratosui/core';
import { EntityCatalogModule } from '../../store/src/entity-catalog.module';
import { generateCFEntities } from './cf-entity-generator';
import { setCfInfoHelperInjector } from './services/endpoint-data/cf-info-helper';
import { CfUserService } from './shared/data-services/cf-user.service';
import { CloudFoundryService } from './shared/data-services/cloud-foundry.service';
import { LongRunningCfOperationsService } from './shared/data-services/long-running-cf-op.service';
import { CloudFoundryUserProvidedServicesService } from './shared/services/cloud-foundry-user-provided-services.service';
import { CloudFoundryStoreModule } from './store/cloud-foundry.store.module';
import { cfCurrentUserPermissionsService } from './user-permissions/cf-user-permissions-checkers';

@NgModule({
  imports: [
    EntityCatalogModule.forFeature(generateCFEntities),
    CommonModule,
    SharedModule,
    MDAppModule,
    CloudFoundryStoreModule,
  ],
  providers: [
    ...cfCurrentUserPermissionsService,
    CfUserService,
    CloudFoundryService,
    LongRunningCfOperationsService,
    CloudFoundryUserProvidedServicesService,
  ]
})
export class CloudFoundryPackageModule {
  constructor() {
    // W-e: capture root injector so the CF endpoint health-check callback
    // (registered in cf-entity-generator at module-init time, outside any
    // Angular injection context) can resolve CfInfoDataRegistry and trigger
    // a signal-native refresh. Replaces the deleted GetCFInfo ngrx effect.
    setCfInfoHelperInjector(inject(Injector));
  }
}
