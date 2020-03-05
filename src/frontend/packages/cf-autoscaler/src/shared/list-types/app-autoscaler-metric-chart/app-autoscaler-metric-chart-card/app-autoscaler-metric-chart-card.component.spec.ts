/* tslint:disable:max-line-length */
import { DatePipe } from '@angular/common';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NgxChartsModule } from '@swimlane/ngx-charts';

import {
  ApplicationEnvVarsHelper,
} from '../../../../../../cloud-foundry/src/features/applications/application/application-tabs-base/tabs/build-tab/application-env-vars.service';
import {
  ServiceActionHelperService,
} from '../../../../../../cloud-foundry/src/shared/data-services/service-action-helper.service';
import { CoreModule } from '../../../../../../core/src/core/core.module';
import {
  ApplicationStateService,
} from '../../../../../../core/src/shared/components/application-state/application-state.service';
import { ConfirmationDialogService } from '../../../../../../core/src/shared/components/confirmation-dialog.service';
import { EntityMonitorFactory } from '../../../../../../store/src/monitors/entity-monitor.factory.service';
import { PaginationMonitorFactory } from '../../../../../../store/src/monitors/pagination-monitor.factory';
import { generateTestApplicationServiceProvider } from '../../../../../../core/test-framework/application-service-helper';
import { createEmptyStoreModule } from '@stratos/store/testing';
import { CfAutoscalerTestingModule } from '../../../../cf-autoscaler-testing.module';
import { AppAutoscalerMetricChartCardComponent } from './app-autoscaler-metric-chart-card.component';
import { AppAutoscalerComboChartComponent } from './combo-chart/combo-chart.component';
import { AppAutoscalerComboSeriesVerticalComponent } from './combo-chart/combo-series-vertical.component';

/* tslint:enable:max-line-length */

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
        CfAutoscalerTestingModule,
        createEmptyStoreModule(),
        CoreModule,
        NgxChartsModule,
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
