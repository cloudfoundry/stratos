import { DatePipe } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { createEmptyStoreModule } from '@stratosui/store/testing';
import { EntityServiceFactory, EntityMonitorFactory, PaginationMonitorFactory, EntityCatalogHelper } from '@stratosui/store';
import { ApplicationEnvVarsHelper, ApplicationStateService } from '@stratosui/cloud-foundry';
import { generateTestApplicationServiceProvider } from '@test-framework/cf';
import { CoreModule, ConfirmationDialogService } from '@stratosui/core';
import { AppTestModule } from '@test-framework';
import { CfAutoscalerTestingModule } from '../../../../cf-autoscaler-testing.module';
import { AppAutoscalerMetricChartCardComponent } from './app-autoscaler-metric-chart-card.component';
import { AppAutoscalerComboSeriesVerticalComponent } from './combo-chart/combo-series-vertical.component';


describe('AppAutoscalerMetricChartCardComponent', () => {
  let component: AppAutoscalerMetricChartCardComponent;
  let fixture: ComponentFixture<AppAutoscalerMetricChartCardComponent>;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        CfAutoscalerTestingModule,
        createEmptyStoreModule(),
        CoreModule,
        AppTestModule,
        AppAutoscalerMetricChartCardComponent,
        AppAutoscalerComboSeriesVerticalComponent,
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
        provideZonelessChangeDetection(),
      ]
    }).compileComponents();
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
