import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import {
  BaseTestModules,
  generateTestCfEndpointServiceProvider,
} from '../../../../../../../../../core/test-framework/cloud-foundry-endpoint-service.helper';
import {
  CloudFoundryOrganizationServiceMock,
} from '../../../../../../../../../core/test-framework/cloud-foundry-organization.service.mock';
import {
  CloudFoundrySpaceServiceMock,
} from '../../../../../../../../../core/test-framework/cloud-foundry-space.service.mock';
import { CloudFoundryOrganizationService } from '../../../../../services/cloud-foundry-organization.service';
import { CloudFoundrySpaceService } from '../../../../../services/cloud-foundry-space.service';
import { CfAdminAddUserWarningComponent } from '../../../../cf-admin-add-user-warning/cf-admin-add-user-warning.component';
import {
  CloudFoundryInviteUserLinkComponent,
} from '../../../cloud-foundry-invite-user-link/cloud-foundry-invite-user-link.component';
import { CloudFoundrySpaceUsersComponent } from './cloud-foundry-space-users.component';

/* tslint:disable:max-line-length */
describe('CloudFoundrySpaceUsersComponent', () => {
  let component: CloudFoundrySpaceUsersComponent;
  let fixture: ComponentFixture<CloudFoundrySpaceUsersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CloudFoundrySpaceUsersComponent, CloudFoundryInviteUserLinkComponent, CfAdminAddUserWarningComponent],
      imports: [...BaseTestModules],
      providers: [
        { provide: CloudFoundrySpaceService, useClass: CloudFoundrySpaceServiceMock },
        { provide: CloudFoundryOrganizationService, useClass: CloudFoundryOrganizationServiceMock },
        ...generateTestCfEndpointServiceProvider()
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundrySpaceUsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
