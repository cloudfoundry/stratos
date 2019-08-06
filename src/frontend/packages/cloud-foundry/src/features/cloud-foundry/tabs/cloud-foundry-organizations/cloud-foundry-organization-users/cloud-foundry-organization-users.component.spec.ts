import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import {
  BaseTestModules,
  generateTestCfEndpointServiceProvider,
} from '../../../../../../../core/test-framework/cloud-foundry-endpoint-service.helper';
import {
  CloudFoundryOrganizationServiceMock,
} from '../../../../../../../core/test-framework/cloud-foundry-organization.service.mock';
import { CloudFoundryOrganizationService } from '../../../services/cloud-foundry-organization.service';
import { CfAdminAddUserWarningComponent } from '../../cf-admin-add-user-warning/cf-admin-add-user-warning.component';
import {
  CloudFoundryInviteUserLinkComponent,
} from '../cloud-foundry-invite-user-link/cloud-foundry-invite-user-link.component';
import { CloudFoundryOrganizationUsersComponent } from './cloud-foundry-organization-users.component';

/* tslint:disable:max-line-length */
describe('CloudFoundryOrganizationUsersComponent', () => {
  let component: CloudFoundryOrganizationUsersComponent;
  let fixture: ComponentFixture<CloudFoundryOrganizationUsersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CloudFoundryOrganizationUsersComponent, CloudFoundryInviteUserLinkComponent, CfAdminAddUserWarningComponent],
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
