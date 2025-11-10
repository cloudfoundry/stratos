import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateCfBaseTestModulesNoShared } from '@test-framework/cf';

import { CfUserService } from '../../../../shared/data-services/cf-user.service';
import { ActiveRouteCfOrgSpace } from '../../cf-page.types';
import { CloudFoundryEndpointService } from '../../services/cloud-foundry-endpoint.service';
import { UserInviteService } from '../../user-invites/user-invite.service';
import { CloudFoundryUsersComponent } from "./cloud-foundry-users.component";

describe('CloudFoundryUsersComponent', () => {
  let component: CloudFoundryUsersComponent;
  let fixture: ComponentFixture<CloudFoundryUsersComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        CloudFoundryUsersComponent,
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(generateCfBaseTestModulesNoShared()),
        ActiveRouteCfOrgSpace,
        UserInviteService,
        CloudFoundryEndpointService,
        CfUserService,
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundryUsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
