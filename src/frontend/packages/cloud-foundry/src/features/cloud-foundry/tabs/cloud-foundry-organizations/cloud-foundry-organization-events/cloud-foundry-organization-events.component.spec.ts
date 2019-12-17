import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ListConfig } from '../../../../../../../core/src/shared/components/list/list.component.types';
import { CFBaseTestModules } from '../../../../../../test-framework/cf-test-helper';
import {
  CloudFoundryEventsListComponent,
} from '../../../../../shared/components/cloud-foundry-events-list/cloud-foundry-events-list.component';
import {
  CfOrganizationEventsConfigService,
} from '../../../../../shared/components/list/list-types/cf-events/types/cf-org-events-config.service';
import { CfUserService } from '../../../../../shared/data-services/cf-user.service';
import { ActiveRouteCfOrgSpace } from '../../../cf-page.types';
import { CloudFoundryEndpointService } from '../../../services/cloud-foundry-endpoint.service';
import { CloudFoundryOrganizationService } from '../../../services/cloud-foundry-organization.service';
import { CloudFoundryOrganizationEventsComponent } from './cloud-foundry-organization-events.component';

describe('CloudFoundryOrganizationEventsComponent', () => {
  let component: CloudFoundryOrganizationEventsComponent;
  let fixture: ComponentFixture<CloudFoundryOrganizationEventsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        CloudFoundryOrganizationEventsComponent,
        CloudFoundryEventsListComponent
      ],
      providers: [
        {
          provide: ListConfig,
          useClass: CfOrganizationEventsConfigService,
        },
        CloudFoundryOrganizationService,
        ActiveRouteCfOrgSpace,
        CfUserService,
        CloudFoundryEndpointService
      ],
      imports: [...CFBaseTestModules]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundryOrganizationEventsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
