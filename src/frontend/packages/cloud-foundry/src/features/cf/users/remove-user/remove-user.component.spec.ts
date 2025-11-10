import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { StoreModule } from '@ngrx/store';
import { describe, it, expect, beforeEach } from 'vitest';

import { TabNavService, CurrentUserPermissionsService } from '@stratosui/core';
import { appReducers } from '@stratosui/store';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';

import { CloudFoundryTestingModule } from '../../../../cloud-foundry-test.module';
import { CfUserService } from '../../../../shared/data-services/cf-user.service';
import { ActiveRouteCfOrgSpace } from '../../cf-page.types';
import { CfRolesService } from '../manage-users/cf-roles.service';
import { RemoveUserComponent } from './remove-user.component';
describe('RemoveUserComponent', () => {
  let component: RemoveUserComponent;
  let fixture: ComponentFixture<RemoveUserComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        RemoveUserComponent,
        StoreModule.forRoot(appReducers, {
          runtimeChecks: { strictStateImmutability: false, strictActionImmutability: false }
        }),
        CloudFoundryTestingModule,
        NoopAnimationsModule,
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        ...STORE_TEST_PROVIDERS,
        ActiveRouteCfOrgSpace,
        CfRolesService,
        CfUserService,
        TabNavService,
        CurrentUserPermissionsService,
      ],
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RemoveUserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
