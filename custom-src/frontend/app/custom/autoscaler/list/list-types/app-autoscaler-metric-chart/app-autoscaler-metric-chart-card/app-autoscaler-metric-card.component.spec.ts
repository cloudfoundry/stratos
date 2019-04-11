import { DatePipe } from '@angular/common';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import {
  ApplicationEnvVarsHelper,
} from '../../../../../../features/applications/application/application-tabs-base/tabs/build-tab/application-env-vars.service';
import { generateTestApplicationServiceProvider } from '../../../../../../../test-framework/application-service-helper';
import { BaseTestModules } from '../../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { createBasicStoreModule } from '../../../../../../../test-framework/store-test-helper';
import { ServiceActionHelperService } from '../../../../../../shared/data-services/service-action-helper.service';
import { EntityMonitorFactory } from '../../../../../../shared/monitors/entity-monitor.factory.service';
import { PaginationMonitorFactory } from '../../../../../../shared/monitors/pagination-monitor.factory';
import { ApplicationStateService } from '../../../../../../shared/components/application-state/application-state.service';
import { ConfirmationDialogService } from '../../../../../../shared/components/confirmation-dialog.service';
import { AppAutoscalerMetricChartCardComponent } from './app-autoscaler-metric-chart-card.component';

describe('AppServiceBindingCardComponent', () => {
  let component: AppAutoscalerMetricChartCardComponent;
  let fixture: ComponentFixture<AppAutoscalerMetricChartCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        ...BaseTestModules,
        createBasicStoreModule(),
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
        app_guid: '',
        service_instance_guid: '',
        credentials: {},
        binding_options: {},
        gateway_name: '',
        volume_mounts: [],
        app_url: '',
        service_instance_url: '',
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
