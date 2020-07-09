import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { MDAppModule } from '../../core/src/core/md.module';
import { SharedModule } from '../../core/src/shared/shared.module';
import { EntityCatalogModule } from '../../store/src/entity-catalog.module';
import { generateCFEntities } from './cf-entity-generator';
import { CfUserService } from './shared/data-services/cf-user.service';
import { CloudFoundryService } from './shared/data-services/cloud-foundry.service';
import { LongRunningCfOperationsService } from './shared/data-services/long-running-cf-op.service';
import { GitSCMService } from './shared/data-services/scm/scm.service';
import { ServiceActionHelperService } from './shared/data-services/service-action-helper.service';
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
    ServiceActionHelperService,
    LongRunningCfOperationsService,
    CloudFoundryUserProvidedServicesService,
    GitSCMService,
  ]
})
export class CloudFoundryPackageModule { }
