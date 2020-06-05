import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';

import { generateASEntities } from '../../cf-autoscaler/src/store/autoscaler-entity-generator';
import { generateStratosEntities } from '../../core/src/base-entity-types';
import { getGitHubAPIURL, GITHUB_API_URL } from '../../core/src/core/github.helpers';
import { LoggerService } from '../../core/src/core/logger.service';
import { CATALOGUE_ENTITIES, EntityCatalogFeatureModule } from '../../store/src/entity-catalog.module';
import { entityCatalog, TestEntityCatalog } from '../../store/src/entity-catalog/entity-catalog';
import { testSCFEndpointGuid } from '../../store/testing/public-api';
import { BaseCfOrgSpaceRouteMock } from '../test-framework/cloud-foundry-endpoint-service.helper';
import { generateCFEntities } from './cf-entity-generator';
import { ActiveRouteCfOrgSpace } from './features/cloud-foundry/cf-page.types';
import { CfUserService } from './shared/data-services/cf-user.service';
import { LongRunningCfOperationsService } from './shared/data-services/long-running-cf-op.service';
import { GitSCMService } from './shared/data-services/scm/scm.service';
import { CloudFoundryStoreModule } from './store/cloud-foundry.store.module';

@NgModule({
  imports: [
    {
      ngModule: EntityCatalogFeatureModule,
      providers: [
        {
          provide: CATALOGUE_ENTITIES, useFactory: () => {
            const testEntityCatalog = entityCatalog as TestEntityCatalog;
            testEntityCatalog.clear();
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
    LoggerService,
    LongRunningCfOperationsService,
    CfUserService,
    {
      provide: ActiveRouteCfOrgSpace,
      useFactory: () => new BaseCfOrgSpaceRouteMock(testSCFEndpointGuid)
    }
  ]
})
export class CloudFoundryTestingModule { }
