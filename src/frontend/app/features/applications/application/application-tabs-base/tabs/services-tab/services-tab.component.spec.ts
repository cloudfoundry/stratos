import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ServicesTabComponent } from './services-tab.component';
import { BaseTestModules } from '../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { EntityMonitorFactory } from '../../../../../../shared/monitors/entity-monitor.factory.service';
import { generateTestApplicationServiceProvider } from '../../../../../../test-framework/application-service-helper';
import { ApplicationEnvVarsService } from '../build-tab/application-env-vars.service';
import { ApplicationStateService } from '../../../../../../shared/components/application-state/application-state.service';
import { PaginationMonitorFactory } from '../../../../../../shared/monitors/pagination-monitor.factory';

describe('ServicesTabComponent', () => {
  let component: ServicesTabComponent;
  let fixture: ComponentFixture<ServicesTabComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ServicesTabComponent],
      imports: [...BaseTestModules],
      providers: [
        EntityMonitorFactory,
        generateTestApplicationServiceProvider('1', '1'),
        ApplicationEnvVarsService,
        ApplicationStateService,
        PaginationMonitorFactory
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
