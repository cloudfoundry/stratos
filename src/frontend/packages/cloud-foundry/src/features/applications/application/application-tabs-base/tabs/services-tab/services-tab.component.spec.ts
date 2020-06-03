import { DatePipe } from '@angular/common';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EntityMonitorFactory } from '../../../../../../../../store/src/monitors/entity-monitor.factory.service';
import { PaginationMonitorFactory } from '../../../../../../../../store/src/monitors/pagination-monitor.factory';
import { generateTestApplicationServiceProvider } from '../../../../../../../test-framework/application-service-helper';
import { generateCfBaseTestModules } from '../../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ServiceActionHelperService } from '../../../../../../shared/data-services/service-action-helper.service';
import { ApplicationStateService } from '../../../../../../shared/services/application-state.service';
import { ApplicationEnvVarsHelper } from '../build-tab/application-env-vars.service';
import { ServicesTabComponent } from './services-tab.component';

describe('ServicesTabComponent', () => {
  let component: ServicesTabComponent;
  let fixture: ComponentFixture<ServicesTabComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ServicesTabComponent],
      imports: generateCfBaseTestModules(),
      providers: [
        EntityMonitorFactory,
        generateTestApplicationServiceProvider('1', '1'),
        ApplicationEnvVarsHelper,
        ApplicationStateService,
        PaginationMonitorFactory,
        DatePipe,
        ServiceActionHelperService
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ServicesTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
