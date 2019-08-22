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

// TODO: Remove commented effects once all CF effects are moved across (leaving them here helps with tracking)
@NgModule({
  imports: [
    CloudFoundryReducersModule,
    // HttpModule,
    // HttpClientModule,
    EffectsModule.forFeature([
      // APIEffect,
      // EndpointApiError,
      // AuthEffect,
      // UAASetupEffect,
      // EndpointsEffect,
      CreateAppPageEffects,
      // UpdateAppEffects,
      // PaginationEffects,
      // ActionHistoryEffect,
      AppVariablesEffect,
      // RouterEffect,
      // SystemEffects,
      // SnackBarEffects,
      // SetClientFilterEffect,
      DeployAppEffects,
      GithubEffects,
      CloudFoundryEffects,
      // MetricsEffect,
      // RequestEffect,
      // UserProfileEffect,
      // UsersRolesEffects,
      // RecursiveDeleteEffect,
      // AppEffects,
      RouteEffect,
      // UserFavoritesEffect,
      PermissionsEffects,
      PermissionEffects
    ])
  ]
})
export class CloudFoundryStoreModule { }
