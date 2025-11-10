import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateCfBaseTestModulesNoShared } from '@test-framework/cf';

import { CfUserService } from '../../../../../shared/data-services/cf-user.service';
import { ActiveRouteCfOrgSpace } from '../../../cf-page.types';
import { CfRolesService } from '../cf-roles.service';
import { UsersRolesSelectComponent } from './manage-users-select.component';

describe('UsersRolesSelectComponent', () => {
  let component: UsersRolesSelectComponent;
  let fixture: ComponentFixture<UsersRolesSelectComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        UsersRolesSelectComponent,
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(generateCfBaseTestModulesNoShared()),
        ActiveRouteCfOrgSpace,
        CfRolesService,
        CfUserService,
      ],

    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UsersRolesSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
