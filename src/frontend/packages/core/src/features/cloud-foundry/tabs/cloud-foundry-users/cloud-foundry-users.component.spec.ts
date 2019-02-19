import { HttpClient, HttpHandler } from '@angular/common/http';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UserInviteService } from '../../../../../../../app/features/cloud-foundry/user-invites/user-invite.service';
import { BaseTestModules } from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ActiveRouteCfOrgSpace } from '../../cf-page.types';
import { CloudFoundryEndpointService } from '../../services/cloud-foundry-endpoint.service';
import { CloudFoundryUsersComponent } from './cloud-foundry-users.component';

describe('CloudFoundryUsersComponent', () => {
  let component: CloudFoundryUsersComponent;
  let fixture: ComponentFixture<CloudFoundryUsersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CloudFoundryUsersComponent],
      imports: [
        ...BaseTestModules
      ],
      providers: [
        ActiveRouteCfOrgSpace,
        UserInviteService,
        HttpClient,
        HttpHandler,
        CloudFoundryEndpointService
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
