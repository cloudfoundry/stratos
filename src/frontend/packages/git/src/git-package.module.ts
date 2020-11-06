import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';

import { EntityCatalogModule } from '../../store/src/entity-catalog.module';
import { GitSharedModule } from './shared/git-shared.module';
import { gitEntityCatalog } from './store/git-entity-generator';
import { GitEffects } from './store/git.effects';

@NgModule({
  imports: [
    EntityCatalogModule.forFeature(() => gitEntityCatalog.allGitEntities()),
    EffectsModule.forFeature([
      GitEffects
    ]),
    GitSharedModule
  ],
})
export class GitPackageModule { }

