import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import {
  BaseTestModules,
  generateTestCfEndpointServiceProvider,
} from '../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import {
  CloudFoundryOrganizationServiceMock,
} from '../../../../../../test-framework/cloud-foundry-organization.service.mock';
import { CloudFoundryOrganizationService } from '../../../services/cloud-foundry-organization.service';
import { CfAdminAddUserWarningComponent } from '../../cf-admin-add-user-warning/cf-admin-add-user-warning.component';
import { CloudFoundryOrganizationUsersComponent } from './cloud-foundry-organization-users.component';

describe('CloudFoundryOrganizationUsersComponent', () => {
  let component: CloudFoundryOrganizationUsersComponent;
  let fixture: ComponentFixture<CloudFoundryOrganizationUsersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CloudFoundryOrganizationUsersComponent, CfAdminAddUserWarningComponent],
      imports: [...BaseTestModules],
      providers: [
        { provide: CloudFoundryOrganizationService, useClass: CloudFoundryOrganizationServiceMock },
        generateTestCfEndpointServiceProvider(),
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundryOrganizationUsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
