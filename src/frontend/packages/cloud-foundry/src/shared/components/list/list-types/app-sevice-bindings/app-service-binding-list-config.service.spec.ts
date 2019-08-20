import { DatePipe } from '@angular/common';
import { inject, TestBed } from '@angular/core/testing';

import { generateTestApplicationServiceProvider } from '../../../../../../../core/test-framework/application-service-helper';
import { BaseTestModules } from '../../../../../../../core/test-framework/cloud-foundry-endpoint-service.helper';
import {
  ApplicationEnvVarsHelper,
} from '../../../../../features/applications/application/application-tabs-base/tabs/build-tab/application-env-vars.service';
import { AppServiceBindingListConfigService } from './app-service-binding-list-config.service';

describe('AppServiceBindingListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AppServiceBindingListConfigService,
        generateTestApplicationServiceProvider('1', '1'),
        ApplicationEnvVarsHelper,
        DatePipe
      ],
      imports: [...BaseTestModules]
    });
  });

  it('should be created', inject([AppServiceBindingListConfigService], (service: AppServiceBindingListConfigService) => {
    expect(service).toBeTruthy();
  }));
});
