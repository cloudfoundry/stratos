import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { SharedModule } from '../../../../../shared.module';
import { CfEndpointCardComponent } from './endpoint-card.component';
import { EntityMonitorFactory } from '../../../../../monitors/entity-monitor.factory.service';
import { createBasicStoreModule } from '../../../../../../test-framework/store-test-helper';
import { BaseTestModules } from '../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ServiceActionHelperService } from '../../../../../data-services/service-action-helper.service';

describe('EndpointCardComponent', () => {
  let component: CfEndpointCardComponent;
  let fixture: ComponentFixture<CfEndpointCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        createBasicStoreModule(),
        SharedModule,
        RouterTestingModule,
        BaseTestModules,
      ],
      providers: [
        EntityMonitorFactory,
        ServiceActionHelperService
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CfEndpointCardComponent);
    component = fixture.componentInstance;
    component.row = {
      name: 'test',
      user: {
        admin: false,
        name: '',
        guid: '',
      },
      metricsAvailable: false,
      system_shared_token: false,
      sso_allowed: false,
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
