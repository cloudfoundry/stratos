import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { getGitHubAPIURL, GITHUB_API_URL, GitSCMService } from '@stratosui/git';

import { CATALOGUE_ENTITIES, EntityCatalogFeatureModule } from '../../store/src/entity-catalog.module';
import { entityCatalog, TestEntityCatalog } from '../../store/src/entity-catalog/entity-catalog';
import { generateStratosEntities } from '../../store/src/stratos-entity-generator';
import { testSCFEndpointGuid } from '../../store/testing/public-api';
import { BaseCfOrgSpaceRouteMock } from '../test-framework/cloud-foundry-endpoint-service.helper';
import { generateCFEntities } from './cf-entity-generator';
import { ActiveRouteCfOrgSpace } from './features/cf/cf-page.types';
import { CfUserService } from './shared/data-services/cf-user.service';
import { LongRunningCfOperationsService } from './shared/data-services/long-running-cf-op.service';
import { CloudFoundryStoreModule } from './store/cloud-foundry.store.module';

@NgModule({
  imports: [
    {
      ngModule: EntityCatalogFeatureModule,
      providers: [
        {
          provide: CATALOGUE_ENTITIES,
          useFactory: () => {
            const testEntityCatalog = entityCatalog as TestEntityCatalog;
            testEntityCatalog.clear();
            return [
              ...generateCFEntities(),
              ...generateStratosEntities(),
            ];
          },
          multi: true
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
    LongRunningCfOperationsService,
    CfUserService,
    {
      provide: ActiveRouteCfOrgSpace,
      useFactory: () => new BaseCfOrgSpaceRouteMock(testSCFEndpointGuid)
    }
  ]
})
export class CloudFoundryTestingModule {

  constructor() {
    console.log('CloudFoundryTestingModule');
  }
 }
