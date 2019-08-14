import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';
import { EffectsModule } from '@ngrx/effects';

import { generateStratosEntities } from '../../core/src/base-entity-types';
import { CATALOGUE_ENTITIES, EffectsFeatureModule } from '../../core/src/core/entity-catalogue.module';
import { entityCatalogue, TestEntityCatalogue } from '../../core/src/core/entity-catalogue/entity-catalogue.service';
import { getGitHubAPIURL, GITHUB_API_URL } from '../../core/src/core/github.helpers';
import { LoggerService } from '../../core/src/core/logger.service';
import { GitSCMService } from '../../core/src/shared/data-services/scm/scm.service';
import { generateCFEntities } from './cf-entity-generator';
import { CloudFoundryStoreModule } from './store/cloud-foundry.store.module';

@NgModule({
  imports: [
    // Either this is AppStoreModule (containing forRoot) is needed to allow other effects to be added.. to ensure we have the correct
    // properties in the store (all properties need a reducer/effect)
    // AppStoreModule,
    {
      ngModule: EffectsFeatureModule,
      providers: [
        {
          provide: CATALOGUE_ENTITIES, useFactory: () => {
            const testEntityCatalogue = entityCatalogue as TestEntityCatalogue;
            testEntityCatalogue.clear();
            return [
              ...generateCFEntities(),
              ...generateStratosEntities()
            ];
          }
        }
      ]
    },
    // EffectsModule.forRoot(baseEffects),
    EffectsModule.forRoot([]),

    CloudFoundryStoreModule,
    // HttpClientModule,
    HttpClientTestingModule,
    HttpModule,
  ],
  providers: [
    { provide: GITHUB_API_URL, useFactory: getGitHubAPIURL },
    GitSCMService,
    LoggerService
  ]
})
export class CloudFoundryTestingModule { }
