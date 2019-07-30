import { NgModule } from '@angular/core';

import { CloudFoundryComponentsModule } from './shared/components/components.module';
import { CloudFoundryStoreModule } from './store/cloud-foundry.store.module';
import { EntityCatalogueModule } from '../../core/src/core/entity-catalogue.module';
import { generateCFEntities } from './cf-entity-generator';

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
})
export class CloudFoundryPackageModule { }
