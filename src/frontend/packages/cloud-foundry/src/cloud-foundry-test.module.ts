import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { getGitHubAPIURL, GITHUB_API_URL, GitSCMService } from '@stratosui/git';
import { CATALOGUE_ENTITIES, EntityCatalogFeatureModule, entityCatalog, TestEntityCatalog, generateStratosEntities } from '@stratosui/store';
import { testSCFEndpointGuid } from '@stratosui/store/testing';

import { generateASEntities } from '../../cf-autoscaler/src/store/autoscaler-entity-generator';
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
              ...generateASEntities(), // FIXME: Remove hard link between cf and autoscaler packages #4416
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
export class CloudFoundryTestingModule { }
