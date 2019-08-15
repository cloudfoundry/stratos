import { inject, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { GetApplication } from '../../../../cloud-foundry/src/actions/application.actions';
import { applicationEntityType, cfEntityFactory } from '../../../../cloud-foundry/src/cf-entity-factory';
import { CoreModule } from '../../../../core/src/core/core.module';
import { ExtensionService } from '../../../../core/src/core/extension/extension-service';
import { getGitHubAPIURL, GITHUB_API_URL } from '../../../../core/src/core/github.helpers';
import { ApplicationStateService } from '../../../../core/src/shared/components/application-state/application-state.service';
import { GitSCMService } from '../../../../core/src/shared/data-services/scm/scm.service';
import { EntityMonitorFactory } from '../../../../core/src/shared/monitors/entity-monitor.factory.service';
import { PaginationMonitorFactory } from '../../../../core/src/shared/monitors/pagination-monitor.factory';
import { generateTestApplicationServiceProvider } from '../../../../core/test-framework/application-service-helper';
import { generateTestEntityServiceProvider } from '../../../../core/test-framework/entity-service.helper';
import { AppStoreModule } from '../../../../store/src/store.module';
import { ApplicationService } from './application.service';
import { ApplicationEnvVarsHelper } from './application/application-tabs-base/tabs/build-tab/application-env-vars.service';

describe('ApplicationService', () => {

  const appId = '1';
  const cfId = '2';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        CoreModule,
        AppStoreModule,
        RouterTestingModule,
      ],
      providers: [
        generateTestEntityServiceProvider(
          appId,
          cfEntityFactory(applicationEntityType),
          new GetApplication(appId, cfId)
        ),
        generateTestApplicationServiceProvider(cfId, appId),
        ApplicationStateService,
        ApplicationEnvVarsHelper,
        EntityMonitorFactory,
        PaginationMonitorFactory,
        { provide: GITHUB_API_URL, useFactory: getGitHubAPIURL },
        GitSCMService,
        ExtensionService
      ]
    });
  });

  it('should be created', inject([ApplicationService], (service: ApplicationService) => {
    expect(service).toBeTruthy();
  }));
});
