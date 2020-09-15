import { CommonModule } from '@angular/common';
import { inject, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { CoreModule } from '../../../../../../../core/src/core/core.module';
import { SharedModule } from '../../../../../../../core/src/shared/shared.module';
import { generateTestApplicationServiceProvider } from '../../../../../../test-framework/application-service-helper';
import { generateCfStoreModules } from '../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ApplicationsModule } from '../../../../../features/applications/applications.module';
import { CfAppVariablesListConfigService } from './cf-app-variables-list-config.service';

describe('CfAppVariablesListConfigService', () => {

  beforeEach(() => {
    const cfGuid = 'cfGuid';
    const appGuid = 'appGuid';

    TestBed.configureTestingModule({
      providers: [
        CfAppVariablesListConfigService,
        generateTestApplicationServiceProvider(appGuid, cfGuid)
      ],
      imports: [
        generateCfStoreModules(),
        CommonModule,
        CoreModule,
        SharedModule,
        ApplicationsModule,
        RouterTestingModule
      ]
    });
  });

  it('should be created', inject(
    [CfAppVariablesListConfigService],
    (service: CfAppVariablesListConfigService) => {
      expect(service).toBeTruthy();
    }));
});
