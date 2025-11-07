import { HttpClientModule } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { CoreModule } from '../../../../../core/src/core/core.module';
import { EntityMonitorFactory } from '@stratosui/store/monitors/entity-monitor.factory.service';
import { PaginationMonitorFactory } from '@stratosui/store/monitors/pagination-monitor.factory';
import { generateCfStoreModules } from "@test-framework/cloud-foundry-endpoint-service.helper";
import { CfUserServiceTestProvider } from "@test-framework/user-service-helper";
import { ActiveRouteCfOrgSpace } from '../../../features/cf/cf-page.types';
import { CfRolesService } from '../../../features/cf/users/manage-users/cf-roles.service';
import { CfRoleCheckboxComponent } from './cf-role-checkbox.component';
import { EntityServiceFactory } from "@stratosui/store/entity-service-factory.service";
describe('CfRoleCheckboxComponent', () => {
  let component: CfRoleCheckboxComponent;
  let fixture: ComponentFixture<CfRoleCheckboxComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        CfRoleCheckboxComponent,
        ...generateCfStoreModules(),
        CoreModule,
        NoopAnimationsModule,
        HttpClientModule,
      ],
      providers: [
        EntityServiceFactory,
        
        CfUserServiceTestProvider,
        CfRolesService,
        PaginationMonitorFactory,
        ActiveRouteCfOrgSpace,
        EntityMonitorFactory,

        provideZonelessChangeDetection(),
      ],
      
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CfRoleCheckboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
