import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { getGitHubAPIURL, GITHUB_API_URL } from '@stratosui/git';
import { CATALOGUE_ENTITIES, EntityCatalogFeatureModule, entityCatalog, TestEntityCatalog, generateStratosEntities } from '@stratosui/store';
import { testSCFEndpointGuid } from '@stratosui/store/testing';
import { generateASEntities } from '@stratosui/cf-autoscaler';

import { BaseCfOrgSpaceRouteMock } from '../test-framework/cloud-foundry-endpoint-service.helper';
import { generateCFEntities } from './cf-entity-generator';
import { ActiveRouteCfOrgSpace } from './features/cf/cf-page.types';
import { CfUserService } from './shared/data-services/cf-user.service';
import { LongRunningCfOperationsService } from './shared/data-services/long-running-cf-op.service';
import { CloudFoundryReducersModule } from './store/cloud-foundry.reducers.module';
import { cfCurrentUserPermissionsService } from './user-permissions/cf-user-permissions-checkers';
import { DeployAppEffects } from './store/effects/deploy-app.effects';
import { CfValidateEffects } from './store/effects/request.effects';
import { ServiceInstanceEffects } from './store/effects/service-instance.effects';
import { UsersRolesEffects } from './store/effects/users-roles.effects';

@NgModule({
  imports: [
    EntityCatalogFeatureModule,
    CloudFoundryReducersModule,
    EffectsModule.forRoot([]),
    EffectsModule.forFeature([
      DeployAppEffects,
      ServiceInstanceEffects,
      CfValidateEffects,
      UsersRolesEffects
    ]),
    HttpClientTestingModule,
  ],
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
    },
    { provide: GITHUB_API_URL, useFactory: getGitHubAPIURL },
    LongRunningCfOperationsService,
    CfUserService,
    {
      provide: ActiveRouteCfOrgSpace,
      useFactory: () => new BaseCfOrgSpaceRouteMock(testSCFEndpointGuid)
    },
    ...cfCurrentUserPermissionsService
  ]
})
export class CloudFoundryTestingModule { }
