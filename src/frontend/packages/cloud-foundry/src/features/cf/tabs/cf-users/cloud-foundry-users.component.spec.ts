import { HttpClient, HttpHandler } from '@angular/common/http';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { generateCfBaseTestModules } from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CfUserService } from '../../../../shared/data-services/cf-user.service';
import { ActiveRouteCfOrgSpace } from '../../cf-page.types';
import { CloudFoundryEndpointService } from '../../services/cloud-foundry-endpoint.service';
import { UserInviteService } from '../../user-invites/user-invite.service';
import { CloudFoundryUsersComponent } from './cloud-foundry-users.component';

describe('CloudFoundryUsersComponent', () => {
  let component: CloudFoundryUsersComponent;
  let fixture: ComponentFixture<CloudFoundryUsersComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [CloudFoundryUsersComponent],
      imports: generateCfBaseTestModules(),
      providers: [
        ActiveRouteCfOrgSpace,
        UserInviteService,
        HttpClient,
        HttpHandler,
        CloudFoundryEndpointService,
        CfUserService
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundryUsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
