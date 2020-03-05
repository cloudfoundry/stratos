/* tslint:disable:max-line-length */
import { DatePipe } from '@angular/common';
import { inject, TestBed } from '@angular/core/testing';

import {
  ApplicationEnvVarsHelper,
} from '../../../../../cloud-foundry/src/features/applications/application/application-tabs-base/tabs/build-tab/application-env-vars.service';
import { EntityServiceFactory } from '../../../../../store/src/entity-service-factory.service';
import {
  ApplicationStateService,
} from '../../../../../core/src/shared/components/application-state/application-state.service';
import { EntityMonitorFactory } from '../../../../../store/src/monitors/entity-monitor.factory.service';
import { PaginationMonitorFactory } from '../../../../../store/src/monitors/pagination-monitor.factory';
import { MetricsRangeSelectorService } from '../../../../../core/src/shared/services/metrics-range-selector.service';
import { generateTestApplicationServiceProvider } from '../../../../../core/test-framework/application-service-helper';
import { createEmptyStoreModule } from '@stratos/store/testing';
import { CfAutoscalerTestingModule } from '../../../cf-autoscaler-testing.module';
import { AppAutoscalerMetricChartListConfigService } from './app-autoscaler-metric-chart-list-config.service';


/* tslint:enable:max-line-length */

describe('AppAutoscalerMetricChartListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AppAutoscalerMetricChartListConfigService,
        generateTestApplicationServiceProvider('1', '1'),
        ApplicationEnvVarsHelper,
        DatePipe,
        EntityServiceFactory,
        EntityMonitorFactory,
        ApplicationStateService,
        PaginationMonitorFactory,
        MetricsRangeSelectorService
      ],
      imports: [
        CfAutoscalerTestingModule,
        createEmptyStoreModule(),
      ]
    });
  });

  it('should be created', inject([AppAutoscalerMetricChartListConfigService], (service: AppAutoscalerMetricChartListConfigService) => {
    expect(service).toBeTruthy();
  }));
});
