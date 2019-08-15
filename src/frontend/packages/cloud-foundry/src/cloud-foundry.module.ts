import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { EntityCatalogueModule } from '../../core/src/core/entity-catalogue.module';
import { MDAppModule } from '../../core/src/core/md.module';
import { SharedModule } from '../../core/src/shared/shared.module';
import { generateCFEntities } from './cf-entity-generator';
import { ApplicationsModule } from './features/applications/applications.module';
import { CloudFoundryModule } from './features/cloud-foundry/cloud-foundry.module';
import { ServiceCatalogModule } from './features/service-catalog/service-catalog.module';
import { ServicesModule } from './features/services/services.module';
import { CloudFoundryComponentsModule } from './shared/components/components.module';
import { CfUserService } from './shared/data-services/cf-user.service';
import { CloudFoundryService } from './shared/data-services/cloud-foundry.service';
import { ServiceActionHelperService } from './shared/data-services/service-action-helper.service';
import { CloudFoundryStoreModule } from './store/cloud-foundry.store.module';
import { ENTITY_INFO_HANDLER } from '../../core/src/core/entity-service';
import { RequestInfoState } from '../../store/src/reducers/api-request-reducer/types';
import { ICFAction } from '../../store/src/types/request.types';
import { EntityInfo } from '../../store/src/types/api.types';
import { ValidateEntitiesStart } from '../../store/src/actions/request.actions';

export function shouldValidate(shouldSkip: boolean, isValidated: boolean, entityInfo: RequestInfoState) {
  if (!entityInfo || shouldSkip || isValidated) {
    return false;
  }
  return entityInfo.fetching ||
    entityInfo.error ||
    entityInfo.deleting.busy ||
    entityInfo.deleting.deleted;
}

export function infoValidator(action: ICFAction, dispatcher) {
  let validated = false;
  return (entityInfo: EntityInfo) => {
    if (!entityInfo || entityInfo.entity) {
      if (shouldValidate(action.skipValidation, validated, entityInfo.entityRequestInfo)) {
        validated = true;
        dispatcher(new ValidateEntitiesStart(
          action,
          [entityInfo.entity.metadata.guid],
          false
        ));
      }
    }
  };
};
@NgModule({
  imports: [
    EntityCatalogueModule.forFeature(generateCFEntities),
    CommonModule,
    SharedModule,
    MDAppModule,
    ApplicationsModule,
    CloudFoundryModule,
    ServiceCatalogModule,
    ServicesModule,
    CloudFoundryStoreModule,
    // FIXME: Ensure that anything lazy loaded is not included here - #3675
    CloudFoundryComponentsModule,
    // FIXME: Move cf effects into cf module - #3675
    // EffectsModule.for Root([
    //   PermissionsEffects,
    //   PermissionEffects
    // ])
  ],

  providers: [
    { provide: ENTITY_INFO_HANDLER, useExisting: infoValidator },
    CfUserService,
    CloudFoundryService,
    ServiceActionHelperService,
  ]
})
export class CloudFoundryPackageModule { }
