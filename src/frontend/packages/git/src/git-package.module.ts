import { NgModule } from '@angular/core';

import { EntityCatalogModule } from '@stratosui/store';
import { GitSharedModule } from './shared/git-shared.module';
import { gitEntityCatalog } from './store/git-entity-generator';

@NgModule({
  imports: [
    EntityCatalogModule.forFeature(() => gitEntityCatalog.allGitEntities()),
    GitSharedModule,
  ],
})
export class GitPackageModule { }

