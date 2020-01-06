import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';

import { CloudFoundryReducersModule } from './cloud-foundry.reducers.module';
import { AppVariablesEffect } from './effects/app-variables.effects';
import { CloudFoundryEffects } from './effects/cloud-foundry.effects';
import { CreateAppPageEffects } from './effects/create-app-effects';
import { DeployAppEffects } from './effects/deploy-app.effects';
import { GithubEffects } from './effects/github.effects';
import { PermissionEffects, PermissionsEffects } from './effects/permissions.effect';
import { RouteEffect } from './effects/route.effects';
import { ServiceInstanceEffects } from './effects/service-instance.effects';

@NgModule({
  imports: [
    CloudFoundryReducersModule,
    EffectsModule.forFeature([
      CreateAppPageEffects,
      AppVariablesEffect,
      DeployAppEffects,
      GithubEffects,
      CloudFoundryEffects,
      RouteEffect,
      PermissionsEffects,
      PermissionEffects,
      ServiceInstanceEffects
    ])
  ]
})
export class CloudFoundryStoreModule { }
