import { HttpClientModule } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { CoreModule } from '../../../../../../../core/src/core/core.module';
import { SharedModule } from '../../../../../../../core/src/shared/shared.module';
import { generateCfStoreModules } from "@test-framework/cloud-foundry-endpoint-service.helper";
import { CfUserService } from '../../../../../shared/data-services/cf-user.service';
import { ActiveRouteCfOrgSpace } from '../../../cf-page.types';
import { CfRolesService } from '../cf-roles.service';
import { ManageUsersSetUsernamesComponent } from "./manage-users-set-usernames.component";
describe('ManageUsersSetUsernamesComponent', () => {
  let component: ManageUsersSetUsernamesComponent;
  let fixture: ComponentFixture<ManageUsersSetUsernamesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ManageUsersSetUsernamesComponent,
        ...generateCfStoreModules(),
        CoreModule,
        SharedModule,
        NoopAnimationsModule,
        HttpClientModule,
      ],
      providers: [
        
        ActiveRouteCfOrgSpace,
        CfRolesService,
        CfUserService,

        provideZonelessChangeDetection(),
      ],
      
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ManageUsersSetUsernamesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
