import { NgModule } from '@angular/core';

import { registerCFEntities } from './cf-entity-generator';
import { CloudFoundryComponentsModule } from './shared/components/components.module';

registerCFEntities();

@NgModule({
  imports: [
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
