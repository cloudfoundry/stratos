import { DatePipe } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { createEmptyStoreModule } from "@test-framework/cf-autoscaler-test.helper";

import {
  ApplicationEnvVarsHelper,
} from '../../../../../../cloud-foundry/src/features/applications/application/application-tabs-base/tabs/build-tab/application-env-vars.service';
import {
  ServiceActionHelperService,
} from '../../../../../../cloud-foundry/src/shared/data-services/service-action-helper.service';
import { ApplicationStateService } from '../../../../../../cloud-foundry/src/shared/services/application-state.service';
import {
  generateTestApplicationServiceProvider,
} from '../../../../../../cloud-foundry/test-framework/application-service-helper';
import { CoreModule } from '../../../../../../core/src/core/core.module';
import { ConfirmationDialogService } from '../../../../../../core/src/shared/components/confirmation-dialog.service';
import { AppTestModule } from '../../../../../../core/test-framework/core-test.helper';
import {
  EntityCatalogHelper,
} from '../../../../../../store/src/entity-catalog/entity-catalog-entity/entity-catalog.service';
import { EntityMonitorFactory } from '../../../../../../store/src/monitors/entity-monitor.factory.service';
import { PaginationMonitorFactory } from '../../../../../../store/src/monitors/pagination-monitor.factory';
import { CfAutoscalerTestingModule } from '../../../../cf-autoscaler-testing.module';
import { AppAutoscalerMetricChartCardComponent } from './app-autoscaler-metric-chart-card.component';
import { AppAutoscalerComboSeriesVerticalComponent } from './combo-chart/combo-series-vertical.component';
import { EntityServiceFactory } from '../../../../../store/src/entity-service-factory.service';


describe('AppAutoscalerMetricChartCardComponent', () => {
  let component: AppAutoscalerMetricChartCardComponent;
  let fixture: ComponentFixture<AppAutoscalerMetricChartCardComponent>;
  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [
        AppAutoscalerComboSeriesVerticalComponent,
      ],
      imports: [
        CfAutoscalerTestingModule,
        createEmptyStoreModule(),
        CoreModule,
        AppTestModule,
        AppAutoscalerMetricChartCardComponent,
      ],
      providers: [
        EntityServiceFactory,
        
        EntityMonitorFactory,
        EntityCatalogHelper,
        generateTestApplicationServiceProvider('1', '1'),
        ApplicationEnvVarsHelper,
        ApplicationStateService,
        PaginationMonitorFactory,
        ConfirmationDialogService,
        DatePipe,
        ServiceActionHelperService,

        provideZonelessChangeDetection(),
      ]
    }),
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AppAutoscalerMetricChartCardComponent);
    component = fixture.componentInstance;
    component.row = {
      entity: {
        upper: [],
        lower: [],
      },
      metadata: {
        guid: '',
        created_at: '',
        updated_at: '',
        url: ''
      }
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
