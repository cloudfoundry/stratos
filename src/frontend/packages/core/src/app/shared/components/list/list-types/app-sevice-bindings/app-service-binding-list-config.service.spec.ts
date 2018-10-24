import { inject, TestBed } from '@angular/core/testing';

import {
  ApplicationEnvVarsHelper,
} from '../../../../../features/applications/application/application-tabs-base/tabs/build-tab/application-env-vars.service';
import { generateTestApplicationServiceProvider } from '../../../../../test-framework/application-service-helper';
import { BaseTestModules } from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { AppServiceBindingListConfigService } from './app-service-binding-list-config.service';
import { DatePipe } from '@angular/common';

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
