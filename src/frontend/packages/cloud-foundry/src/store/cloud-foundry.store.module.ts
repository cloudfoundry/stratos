import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { GitPackageModule } from '@stratosui/git';

import { ActiveRouteCfOrgSpace } from '../features/cf/cf-page.types';
import { CloudFoundryReducersModule } from './cloud-foundry.reducers.module';
import { AppVariablesEffect } from './effects/app-variables.effects';
import { AppEffects } from './effects/app.effects';
import { AutoscalerInfoEffects } from './effects/autoscaler-info.effects';
import { CloudFoundryEffects } from './effects/cloud-foundry.effects';
import { CreateAppPageEffects } from './effects/create-app-effects';
import { DeployAppEffects } from './effects/deploy-app.effects';
import { CfValidateEffects } from './effects/request.effects';
import { RouteEffect } from './effects/route.effects';
import { ServiceInstanceEffects } from './effects/service-instance.effects';
import { UpdateAppEffects } from './effects/update-app-effects';
import { UsersRolesEffects } from './effects/users-roles.effects';

@NgModule({
  imports: [
    CloudFoundryReducersModule,
    EffectsModule.forFeature([
      CreateAppPageEffects,
      AppVariablesEffect,
      DeployAppEffects,
      CloudFoundryEffects,
      RouteEffect,
      ServiceInstanceEffects,
      AppEffects,
      UpdateAppEffects,
      CfValidateEffects,
      UsersRolesEffects,
      AutoscalerInfoEffects,
    ]),
    // Brings in GitSCMService
    GitPackageModule,
  ],
  providers: [
    {
      provide: ActiveRouteCfOrgSpace,
      useValue: {}
    },
  ]
})
export class CloudFoundryStoreModule { }
