import { DatePipe } from '@angular/common';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NgxChartsModule } from '@swimlane/ngx-charts';

import {
  ApplicationEnvVarsHelper,
} from '../../../../../../core/src/features/applications/application/application-tabs-base/tabs/build-tab/application-env-vars.service';
import {
  ApplicationStateService,
} from '../../../../../../core/src/shared/components/application-state/application-state.service';
import { ConfirmationDialogService } from '../../../../../../core/src/shared/components/confirmation-dialog.service';
import { ServiceActionHelperService } from '../../../../../../core/src/shared/data-services/service-action-helper.service';
import { EntityMonitorFactory } from '../../../../../../core/src/shared/monitors/entity-monitor.factory.service';
import { PaginationMonitorFactory } from '../../../../../../core/src/shared/monitors/pagination-monitor.factory';
import { generateTestApplicationServiceProvider } from '../../../../../../core/test-framework/application-service-helper';
import { BaseTestModules } from '../../../../../../core/test-framework/cloud-foundry-endpoint-service.helper';
import { AppAutoscalerMetricChartCardComponent } from './app-autoscaler-metric-chart-card.component';
import { AppAutoscalerComboChartComponent } from './combo-chart/combo-chart.component';
import { AppAutoscalerComboSeriesVerticalComponent } from './combo-chart/combo-series-vertical.component';

describe('AppAutoscalerMetricChartCardComponent', () => {
  let component: AppAutoscalerMetricChartCardComponent;
  let fixture: ComponentFixture<AppAutoscalerMetricChartCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        AppAutoscalerMetricChartCardComponent,
        AppAutoscalerComboChartComponent,
        AppAutoscalerComboSeriesVerticalComponent
      ],
      imports: [
        ...BaseTestModules,
        NgxChartsModule
      ],
      providers: [
        EntityMonitorFactory,
        generateTestApplicationServiceProvider('1', '1'),
        ApplicationEnvVarsHelper,
        ApplicationStateService,
        PaginationMonitorFactory,
        ConfirmationDialogService,
        DatePipe,
        ServiceActionHelperService,
      ]
    })
      .compileComponents();
  }));

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
