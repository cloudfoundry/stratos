import { NgModule, inject } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { GitPackageModule } from '@stratosui/git';

import { ActiveRouteCfOrgSpace } from '../features/cf/cf-page.types';
import { CloudFoundryReducersModule } from './cloud-foundry.reducers.module';
import { CfValidateEffects } from './effects/request.effects';
import { ServiceInstanceEffects } from './effects/service-instance.effects';
import { CfEndpointRoleSyncService } from './services/cf-endpoint-role-sync.service';

@NgModule({
  imports: [
    CloudFoundryReducersModule,
    EffectsModule.forFeature([
      ServiceInstanceEffects,
      CfValidateEffects,
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
export class CloudFoundryStoreModule {
  // Wave 5 (W36-B): Eagerly instantiate the CF role-sync service so its
  // signal effects start observing EndpointsDataService deltas before any
  // user-driven endpoint mutation can fire. Replaces the legacy
  // REGISTER/CONNECT/DISCONNECT/UNREGISTER_ENDPOINTS_SUCCESS reducer
  // listeners on currentCfUserRolesReducer.
  constructor() {
    inject(CfEndpointRoleSyncService);
  }
}
