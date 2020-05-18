import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { MDAppModule } from '../../core/src/core/md.module';
import {
  CloudFoundryUserProvidedServicesService,
} from '../../core/src/shared/services/cloud-foundry-user-provided-services.service';
import { SharedModule } from '../../core/src/shared/shared.module';
import { CfValidateEntitiesStart } from '../../store/src/actions/request.actions';
import { EntityCatalogModule } from '../../store/src/entity-catalog.module';
import { ENTITY_INFO_HANDLER } from '../../store/src/entity-service';
import { RequestInfoState } from '../../store/src/reducers/api-request-reducer/types';
import { EntityInfo } from '../../store/src/types/api.types';
import { ICFAction } from '../../store/src/types/request.types';
import { generateCFEntities } from './cf-entity-generator';
import { isEntityInlineParentAction } from './entity-relations/entity-relations.types';
import { ApplicationsModule } from './features/applications/applications.module';
import { CloudFoundryModule } from './features/cloud-foundry/cloud-foundry.module';
import { ServiceCatalogModule } from './features/service-catalog/service-catalog.module';
import { ServicesModule } from './features/services/services.module';
import { CloudFoundryComponentsModule } from './shared/components/components.module';
import { CfUserService } from './shared/data-services/cf-user.service';
import { CloudFoundryService } from './shared/data-services/cloud-foundry.service';
import { LongRunningCfOperationsService } from './shared/data-services/long-running-cf-op.service';
import { ServiceActionHelperService } from './shared/data-services/service-action-helper.service';
import { CloudFoundryStoreModule } from './store/cloud-foundry.store.module';

function shouldValidate(action: ICFAction, isValidated: boolean, entityInfo: RequestInfoState) {
  // Validate if..
  // 1) The action is the correct type
  const parentAction = isEntityInlineParentAction(action);
  if (!parentAction) {
    return false;
  }
  // 2) We have basic request info
  // 3) The action states it should not be skipped
  // 4) It's already been validated
  // 5) There are actual relations to validate
  if (!entityInfo || action.skipValidation || isValidated || parentAction.includeRelations.length === 0) {
    return false;
  }
  // 6) The entity isn't in the process of being updated
  return !entityInfo.fetching &&
    !entityInfo.error &&
    !entityInfo.deleting.busy &&
    !entityInfo.deleting.deleted &&
    // This is required to ensure that we don't continue trying to fetch missing relations when we're already fetching missing relations
    !Object.keys(entityInfo.updating).find(key => entityInfo.updating[key].busy);
}

function infoValidator(action: ICFAction, dispatcher) {
  let validated = false;
  return (entityInfo: EntityInfo) => {
    if (!entityInfo || entityInfo.entity) {
      if (shouldValidate(action, validated, entityInfo.entityRequestInfo)) {
        validated = true;
        dispatcher(new CfValidateEntitiesStart(
          action,
          [action.guid]
        ));
      }
    }
  };
}
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
    CloudFoundryComponentsModule,
    // FIXME: Move cf effects into cf module - #3675
    // EffectsModule.for Root([
    //   PermissionsEffects,
    //   PermissionEffects
    // ])
  ],
  providers: [
    { provide: ENTITY_INFO_HANDLER, useFactory: () => infoValidator },
    CfUserService,
    CloudFoundryService,
    ServiceActionHelperService,
    LongRunningCfOperationsService,
    CloudFoundryUserProvidedServicesService
  ]
})
export class CloudFoundryPackageModule { }
