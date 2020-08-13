import { DatePipe } from '@angular/common';
import { inject, TestBed } from '@angular/core/testing';
import { createEmptyStoreModule } from '@stratosui/store/testing';

import {
  ApplicationEnvVarsHelper,
} from '../../../../../cloud-foundry/src/features/applications/application/application-tabs-base/tabs/build-tab/application-env-vars.service';
import { ApplicationStateService } from '../../../../../cloud-foundry/src/shared/services/application-state.service';
import {
  generateTestApplicationServiceProvider,
} from '../../../../../cloud-foundry/test-framework/application-service-helper';
import { MetricsRangeSelectorService } from '../../../../../core/src/shared/services/metrics-range-selector.service';
import { AppTestModule } from '../../../../../core/test-framework/core-test.helper';
import { EntityCatalogHelper } from '../../../../../store/src/entity-catalog/entity-catalog-entity/entity-catalog.service';
import { EntityServiceFactory } from '../../../../../store/src/entity-service-factory.service';
import { EntityMonitorFactory } from '../../../../../store/src/monitors/entity-monitor.factory.service';
import { PaginationMonitorFactory } from '../../../../../store/src/monitors/pagination-monitor.factory';
import { CfAutoscalerTestingModule } from '../../../cf-autoscaler-testing.module';
import { AppAutoscalerMetricChartListConfigService } from './app-autoscaler-metric-chart-list-config.service';


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
        EntityCatalogHelper,
        ApplicationStateService,
        PaginationMonitorFactory,
        MetricsRangeSelectorService
      ],
      imports: [
        CfAutoscalerTestingModule,
        createEmptyStoreModule(),
        AppTestModule
      ]
    });
  });

  it('should be created', inject([AppAutoscalerMetricChartListConfigService], (service: AppAutoscalerMetricChartListConfigService) => {
    expect(service).toBeTruthy();
  }));
});
