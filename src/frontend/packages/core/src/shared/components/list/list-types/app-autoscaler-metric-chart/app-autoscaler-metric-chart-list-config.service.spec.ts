import { inject, TestBed } from '@angular/core/testing';

import {
  ApplicationEnvVarsHelper,
} from '../../../../../features/applications/application/application-tabs-base/tabs/build-tab/application-env-vars.service';
import { generateTestApplicationServiceProvider } from '../../../../../../test-framework/application-service-helper';
import { BaseTestModules } from '../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { AppAutoscalerMetricChartListConfigService } from './app-autoscaler-metric-chart-list-config.service';
import { DatePipe } from '@angular/common';

describe('AppAutoscalerMetricChartListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AppAutoscalerMetricChartListConfigService,
        generateTestApplicationServiceProvider('1', '1'),
        ApplicationEnvVarsHelper,
        DatePipe
      ],
      imports: [...BaseTestModules]
    });
  });

  it('should be created', inject([AppAutoscalerMetricChartListConfigService], (service: AppAutoscalerMetricChartListConfigService) => {
    expect(service).toBeTruthy();
  }));
});
