import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { TabNavService } from '../../../../../../../../../core/src/tab-nav.service';
import {
  generateCfBaseTestModules,
  generateTestCfEndpointServiceProvider,
} from "@test-framework/cloud-foundry-endpoint-service.helper";
import {
  CloudFoundryOrganizationServiceMock,
} from "@test-framework/cloud-foundry-organization.service.mock";
import { CloudFoundrySpaceServiceMock } from "@test-framework/cloud-foundry-space.service.mock";
import { CloudFoundryOrganizationService } from '../../../../../services/cloud-foundry-organization.service';
import { CloudFoundrySpaceService } from '../../../../../services/cloud-foundry-space.service';
import { CfAdminAddUserWarningComponent } from '../../../../cf-admin-add-user-warning/cf-admin-add-user-warning.component';
import { CloudFoundryInviteUserLinkComponent } from '../../../cf-invite-user-link/cloud-foundry-invite-user-link.component';
import { CloudFoundrySpaceUsersComponent } from "./cloud-foundry-space-users.component";
describe('CloudFoundrySpaceUsersComponent', () => {
  let component: CloudFoundrySpaceUsersComponent;
  let fixture: ComponentFixture<CloudFoundrySpaceUsersComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        CloudFoundrySpaceUsersComponent,
        CloudFoundryInviteUserLinkComponent,
        CfAdminAddUserWarningComponent,
        ...generateCfBaseTestModules(),
      ],
      providers: [
        
        { provide: CloudFoundrySpaceService, useClass: CloudFoundrySpaceServiceMock },
        { provide: CloudFoundryOrganizationService, useClass: CloudFoundryOrganizationServiceMock },
        ...generateTestCfEndpointServiceProvider(),
        TabNavService,

        provideZonelessChangeDetection(),
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundrySpaceUsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
