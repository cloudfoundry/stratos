import { CommonModule } from '@angular/common';
import { Injector, NgModule, inject } from '@angular/core';

import { MDAppModule } from '../../core/src/core/md.module';
import { SharedModule } from '@stratosui/core';
import { EntityCatalogModule } from '../../store/src/entity-catalog.module';
import { generateCFEntities } from './cf-entity-generator';
import { registerCfRelationDescriptors } from './entity-relations/signal/cf-relation-registrations';
import { SignalRelationFetcherService } from './entity-relations/signal/signal-relation-fetcher.service';
import { EntityDeleteController } from './services/deletes/entity-delete.controller';
import { CfRolesDeleteCleanup } from './services/deletes/cf-roles-cleanup.service';
import { FavoritesRecentsDeleteCleanup } from './services/deletes/favorites-recents-cleanup.service';
import { setCfInfoHelperInjector } from './services/endpoint-data/cf-info-helper';
import { CloudFoundryService } from './shared/data-services/cloud-foundry.service';
import { LongRunningCfOperationsService } from './shared/data-services/long-running-cf-op.service';
import { CloudFoundryUserProvidedServicesService } from './shared/services/cloud-foundry-user-provided-services.service';
import { CloudFoundryStoreModule } from './store/cloud-foundry.store.module';
import { cfCurrentUserPermissionsService } from './user-permissions/cf-user-permissions-checkers';

@NgModule({
  imports: [
    EntityCatalogModule.forFeature(generateCFEntities),
    CommonModule,
    SharedModule,
    MDAppModule,
    CloudFoundryStoreModule,
  ],
  providers: [
    ...cfCurrentUserPermissionsService,
    CloudFoundryService,
    LongRunningCfOperationsService,
    CloudFoundryUserProvidedServicesService,
  ]
})
export class CloudFoundryPackageModule {
  constructor() {
    // W-e: capture root injector so the CF endpoint health-check callback
    // (registered in cf-entity-generator at module-init time, outside any
    // Angular injection context) can resolve CfInfoDataRegistry and trigger
    // a signal-native refresh. Replaces the deleted GetCFInfo ngrx effect.
    setCfInfoHelperInjector(inject(Injector));

    // Register the CF parent→child relation graph so the entity-delete
    // chokepoint can derive a complete invalidation closure (affectedSlices).
    // One source of truth for both fetch (wave β) and delete invalidation.
    registerCfRelationDescriptors(inject(SignalRelationFetcherService));

    // Restore the favorites + recents cleanup the signal-delete migration
    // dropped: on a successful delete the controller fires this hook to remove
    // any stranded favorite/recent for the gone entity.
    inject(EntityDeleteController).registerCleanup(inject(FavoritesRecentsDeleteCleanup).hook);

    // Restore the connected user's role-cache cleanup on org/space delete
    // (the legacy DELETE_ORG/SPACE_SUCCESS reducer update went dead when CF
    // deletes moved off the ngrx pipeline) — favorites/roles island Wave 2.
    inject(EntityDeleteController).registerCleanup(inject(CfRolesDeleteCleanup).hook);
  }
}
