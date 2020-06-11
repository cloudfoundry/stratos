import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { MDAppModule } from '../../core/src/core/md.module';
import { SharedModule } from '../../core/src/shared/shared.module';
import { EntityCatalogModule } from '../../store/src/entity-catalog.module';
import { generateCFEntities } from './cf-entity-generator';
import { ApplicationsModule } from './features/applications/applications.module';
import { CloudFoundryModule } from './features/cloud-foundry/cloud-foundry.module';
import { ServiceCatalogModule } from './features/service-catalog/service-catalog.module';
import { ServicesModule } from './features/services/services.module';
import { CloudFoundrySharedModule } from './shared/cf-shared.module';
import { CfUserService } from './shared/data-services/cf-user.service';
import { CloudFoundryService } from './shared/data-services/cloud-foundry.service';
import { LongRunningCfOperationsService } from './shared/data-services/long-running-cf-op.service';
import { ServiceActionHelperService } from './shared/data-services/service-action-helper.service';
import { CloudFoundryUserProvidedServicesService } from './shared/services/cloud-foundry-user-provided-services.service';
import { CloudFoundryStoreModule } from './store/cloud-foundry.store.module';

@NgModule({
  imports: [
    EntityCatalogModule.forFeature(generateCFEntities),
    CommonModule,
    SharedModule,
    MDAppModule,
    ApplicationsModule,
    CloudFoundryModule,
    ServiceCatalogModule,
    ServicesModule,
    CloudFoundryStoreModule,
    // FIXME: Ensure that anything lazy loaded is not included here - #3675
    CloudFoundrySharedModule,
    // FIXME: Move cf effects into cf module - #3675
    // EffectsModule.for Root([
    //   PermissionsEffects,
    //   PermissionEffects
    // ])
  ],
  providers: [
    CfUserService,
    CloudFoundryService,
    ServiceActionHelperService,
    LongRunningCfOperationsService,
    CloudFoundryUserProvidedServicesService
  ]
})
export class CloudFoundryPackageModule { }
