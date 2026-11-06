import { NgModule, inject } from '@angular/core';
import { GitPackageModule } from '@stratosui/git';

import { ActiveRouteCfOrgSpace } from '../features/cf/cf-page.types';
import { CloudFoundryReducersModule } from './cloud-foundry.reducers.module';
import { CfEndpointRoleSyncService } from './services/cf-endpoint-role-sync.service';

@NgModule({
  imports: [
    CloudFoundryReducersModule,
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
