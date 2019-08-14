import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import {
  BooleanIndicatorComponent,
} from '../../../../../../../../core/src/shared/components/boolean-indicator/boolean-indicator.component';
import { AppChipsComponent } from '../../../../../../../../core/src/shared/components/chips/chips.component';
import {
  ServiceIconComponent,
} from '../../../../../../../../core/src/shared/components/service-icon/service-icon.component';
import { EntityMonitorFactory } from '../../../../../../../../core/src/shared/monitors/entity-monitor.factory.service';
import {
  BaseTestModulesNoShared,
  MetadataCardTestComponents,
} from '../../../../../../../../core/test-framework/cloud-foundry-endpoint-service.helper';
import { CfOrgSpaceLinksComponent } from '../../../../cf-org-space-links/cf-org-space-links.component';
import { CfServiceCardComponent } from './cf-service-card.component';

describe('CfServiceCardComponent', () => {
  let component: CfServiceCardComponent;
  let fixture: ComponentFixture<CfServiceCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        CfServiceCardComponent,
        CfOrgSpaceLinksComponent,
        MetadataCardTestComponents,
        BooleanIndicatorComponent,
        AppChipsComponent,
        ServiceIconComponent
      ],
      imports: [...BaseTestModulesNoShared],
      providers: [
        EntityMonitorFactory
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CfServiceCardComponent);
    component = fixture.componentInstance;
    component.row = {
      entity: {
        label: '',
        description: '',
        active: 1,
        bindable: 1,
        unique_id: '',
        extra: '',
        tags: [''],
        requires: [''],
        service_broker_guid: '',
        plan_updateable: 1,
        service_plans_url: '',
        service_plans: [],

      },
      metadata: null
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
