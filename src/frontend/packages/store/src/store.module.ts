import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';
import { EffectsModule } from '@ngrx/effects';

import { PermissionEffects, PermissionsEffects } from '../../cloud-foundry/src/effects/permissions.effect';
import { ActionHistoryEffect } from './effects/action-history.effects';
import { APIEffect } from './effects/api.effects';
import { AppVariablesEffect } from './effects/app-variables.effects';
import { AppEffects } from './effects/app.effects';
import { AuthEffect } from './effects/auth.effects';
import { CloudFoundryEffects } from './effects/cloud-foundry.effects';
import { DeployAppEffects } from '../../cloud-foundry/src/store/effects/deploy-app.effects';
import { EndpointApiError } from './effects/endpoint-api-errors.effects';
import { EndpointsEffect } from './effects/endpoint.effects';
import { GithubEffects } from '../../cloud-foundry/src/store/effects/github.effects';
import { MetricsEffect } from './effects/metrics.effects';
import { PaginationEffects } from './effects/pagination.effects';
import { RecursiveDeleteEffect } from './effects/recursive-entity-delete.effect';
import { RequestEffect } from './effects/request.effects';
import { RouteEffect } from './effects/route.effects';
import { RouterEffect } from './effects/router.effects';
import { SetClientFilterEffect } from './effects/set-client-filter.effect';
import { SnackBarEffects } from './effects/snackBar.effects';
import { SystemEffects } from './effects/system.effects';
import { UAASetupEffect } from './effects/uaa-setup.effects';
import { UpdateAppEffects } from './effects/update-app-effects';
import { UserFavoritesEffect } from './effects/user-favorites-effect';
import { UserProfileEffect } from './effects/user-profile.effects';
import { UsersRolesEffects } from './effects/users-roles.effects';
import { AppReducersModule } from './reducers.module';

import { CloudFoundryStoreModule } from './../../cloud-foundry/src/store/cloud-foundry.store.module';

@NgModule({
  imports: [
    AppReducersModule,
    HttpModule,
    HttpClientModule,
    EffectsModule.forRoot([
      APIEffect,
      EndpointApiError,
      AuthEffect,
      UAASetupEffect,
      EndpointsEffect,
      // CreateAppPageEffects,
      UpdateAppEffects,
      PaginationEffects,
      ActionHistoryEffect,
      AppVariablesEffect,
      RouterEffect,
      SystemEffects,
      SnackBarEffects,
      SetClientFilterEffect,
      // DeployAppEffects,
      // GithubEffects,
      CloudFoundryEffects,
      MetricsEffect,
      RequestEffect,
      UserProfileEffect,
      UsersRolesEffects,
      RecursiveDeleteEffect,
      AppEffects,
      RouteEffect,
      UserFavoritesEffect,
      // FIXME: STRAT-155 - Move cf effects into cf module
      PermissionsEffects,
      PermissionEffects
    ]),
  ]
})
export class AppStoreModule { }
