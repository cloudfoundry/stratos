import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';

import { generateASEntities } from '../../cf-autoscaler/src/store/autoscaler-entity-generator';
import { generateStratosEntities } from '../../core/src/base-entity-types';
import { CATALOGUE_ENTITIES, EntityCatalogueFeatureModule } from '../../store/src/entity-catalogue.module';
import { entityCatalogue, TestEntityCatalogue } from '../../store/src/entity-catalog/entity-catalogue.service';
import { getGitHubAPIURL, GITHUB_API_URL } from '../../core/src/core/github.helpers';
import { LoggerService } from '../../core/src/core/logger.service';
import { GitSCMService } from '../../core/src/shared/data-services/scm/scm.service';
import { generateCFEntities } from './cf-entity-generator';
import { CloudFoundryStoreModule } from './store/cloud-foundry.store.module';

@NgModule({
  imports: [
    {
      ngModule: EntityCatalogueFeatureModule,
      providers: [
        {
          provide: CATALOGUE_ENTITIES, useFactory: () => {
            const testEntityCatalogue = entityCatalogue as TestEntityCatalogue;
            testEntityCatalogue.clear();
            return [
              ...generateCFEntities(),
              ...generateStratosEntities(),
              ...generateASEntities(), // FIXME: CF should not depend on autoscaler. See #3916
            ];
          }
        }
      ]
    },
    EffectsModule.forRoot([]),
    CloudFoundryStoreModule,
    HttpClientTestingModule,
  ],
  providers: [
    { provide: GITHUB_API_URL, useFactory: getGitHubAPIURL },
    GitSCMService,
    LoggerService
  ]
})
export class CloudFoundryTestingModule { }
