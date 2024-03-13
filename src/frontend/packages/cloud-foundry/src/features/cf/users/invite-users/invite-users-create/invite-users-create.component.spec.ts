import { HttpClient, HttpHandler } from '@angular/common/http';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import {
  generateActiveRouteCfOrgSpaceMock,
  generateCfBaseTestModules,
} from '../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CfUserService } from '../../../../../shared/data-services/cf-user.service';
import { CloudFoundryEndpointService } from '../../../services/cloud-foundry-endpoint.service';
import { UserInviteService } from '../../../user-invites/user-invite.service';
import { InviteUsersCreateComponent } from './invite-users-create.component';

describe('InviteUsersCreateComponent', () => {
  let component: InviteUsersCreateComponent;
  let fixture: ComponentFixture<InviteUsersCreateComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [InviteUsersCreateComponent],
      imports: generateCfBaseTestModules(),
      providers: [
        generateActiveRouteCfOrgSpaceMock(),
        CloudFoundryEndpointService,
        UserInviteService,
        HttpClient,
        HttpHandler,
        CfUserService
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InviteUsersCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
