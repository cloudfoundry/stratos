import { NgModule } from '@angular/core';

import { EntityCatalogModule } from '../../store/src/entity-catalog.module';
import { GitSharedModule } from './shared/git-shared.module';
import { gitEntityCatalog } from './store/git-entity-generator';
import { GitStoreModule } from './store/git-store.module';

@NgModule({
  imports: [
    EntityCatalogModule.forFeature(() => gitEntityCatalog.allGitEntities()),
    GitSharedModule,
    GitStoreModule
  ],
})
export class GitPackageModule { }

