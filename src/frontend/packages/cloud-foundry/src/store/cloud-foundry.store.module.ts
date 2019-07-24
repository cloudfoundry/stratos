import { CreateAppPageEffects } from './effects/create-app-effects';
import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';

import { CloudFoundryReducersModule } from './cloud-foundry.reducers.module';

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
      // AppVariablesEffect,
      // RouterEffect,
      // SystemEffects,
      // SnackBarEffects,
      // SetClientFilterEffect,
      // DeployAppEffects,
      // GithubEffects,
      // CloudFoundryEffects,
      // MetricsEffect,
      // RequestEffect,
      // UserProfileEffect,
      // UsersRolesEffects,
      // RecursiveDeleteEffect,
      // AppEffects,
      // RouteEffect,
      // UserFavoritesEffect,
      // // FIXME: STRAT-155 - Move cf effects into cf module
      // PermissionsEffects,
      // PermissionEffects
    ])
  ]
})
export class CloudFoundryStoreModule { }
