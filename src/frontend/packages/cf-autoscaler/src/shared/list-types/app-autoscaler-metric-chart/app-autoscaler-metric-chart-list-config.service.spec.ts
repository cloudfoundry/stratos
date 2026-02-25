import { DatePipe } from '@angular/common';
import { inject, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import {
  ApplicationEnvVarsHelper,
  ApplicationStateService,
  generateTestApplicationServiceProvider,
} from '@test-framework/cf';
import {
  AppTestModule,
} from '@test-framework';
import {
  EntityCatalogHelper,
} from '@stratosui/store';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { createBasicStoreModule } from '@stratosui/store/testing';
import { MetricsRangeSelectorService } from '../../../../../core/src/shared/services/metrics-range-selector.service';
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
        EntityCatalogHelper,
        ApplicationStateService,
        MetricsRangeSelectorService,
        ...STORE_TEST_PROVIDERS,
        provideZonelessChangeDetection(),
      ],
      imports: [
        CfAutoscalerTestingModule,
        createBasicStoreModule(),
        AppTestModule,
      ]
    });
  });

  it('should be created', inject([AppAutoscalerMetricChartListConfigService], (service: AppAutoscalerMetricChartListConfigService) => {
    expect(service).toBeTruthy();
  }));
});
