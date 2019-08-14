import { NgModule } from '@angular/core';

import { CloudFoundryComponentsModule } from './shared/components/components.module';
import { CloudFoundryStoreModule } from './store/cloud-foundry.store.module';
import { EntityCatalogueModule } from '../../core/src/core/entity-catalogue.module';
import { generateCFEntities } from './cf-entity-generator';
import { ENTITY_INFO_HANDLER } from '../../core/src/core/entity-service';
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
    CloudFoundryStoreModule,
    // FIXME: Ensure that anything lazy loaded is not included here - #3675
    CloudFoundryComponentsModule,
    // FIXME: Move cf effects into cf module - #3675
    // EffectsModule.forRoot([
    //   PermissionsEffects,
    //   PermissionEffects
    // ])
  ],
  providers: [

    { provide: ENTITY_INFO_HANDLER, useExisting: infoValidator }
  ]
})
export class CloudFoundryPackageModule { }
