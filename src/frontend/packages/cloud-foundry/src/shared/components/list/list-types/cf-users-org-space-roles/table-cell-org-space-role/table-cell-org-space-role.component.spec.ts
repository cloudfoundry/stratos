import { HttpClientModule } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import {
  APIResource,
  EntityMonitorFactory,
  EntityServiceFactory,
  PaginationMonitorFactory,
} from '@stratosui/store';
import { generateCfStoreModules } from "@test-framework/cloud-foundry-endpoint-service.helper";
import { CfUserServiceTestProvider } from "@test-framework/user-service-helper";
import { ISpace } from '../../../../../../cf-api.types';
import { ActiveRouteCfOrgSpace } from '../../../../../../features/cf/cf-page.types';
import { CfRolesService } from '../../../../../../features/cf/users/manage-users/cf-roles.service';
import { CfRoleCheckboxComponent } from '../../../../cf-role-checkbox/cf-role-checkbox.component';
import { TableCellRoleOrgSpaceComponent } from './table-cell-org-space-role.component';
describe('TableCellSpaceRoleComponent', () => {
  let component: TableCellRoleOrgSpaceComponent;
  let fixture: ComponentFixture<TableCellRoleOrgSpaceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TableCellRoleOrgSpaceComponent,
        CfRoleCheckboxComponent,
        ...generateCfStoreModules(),
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

    fixture = TestBed.createComponent(TableCellRoleOrgSpaceComponent);
    component = fixture.componentInstance;
    component.row = {
      entity: {}, metadata: {
        guid: '',
        created_at: '',
        updated_at: '',
        url: ''
      }
    } as APIResource<ISpace>;
    component.config = {};
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
