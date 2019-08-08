import { HttpClient, HttpHandler } from '@angular/common/http';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { generateCfBaseTestModules } from '../../../../../../../core/test-framework/cloud-foundry-endpoint-service.helper';
import { CfUserService } from '../../../../../shared/data-services/cf-user.service';
import { ActiveRouteCfOrgSpace } from '../../../cf-page.types';
import { CloudFoundryEndpointService } from '../../../services/cloud-foundry-endpoint.service';
import { UserInviteService } from '../../../user-invites/user-invite.service';
import { InviteUsersCreateComponent } from './invite-users-create.component';

describe('InviteUsersCreateComponent', () => {
  let component: InviteUsersCreateComponent;
  let fixture: ComponentFixture<InviteUsersCreateComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [InviteUsersCreateComponent],
      imports: generateCfBaseTestModules(),
      providers: [
        ActiveRouteCfOrgSpace,
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
