import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpModule } from '@angular/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { ISpace } from '../../../../../../../../core/src/core/cf-api.types';
import { CoreModule } from '../../../../../../../../core/src/core/core.module';
import { EntityMonitorFactory } from '../../../../../../../../core/src/shared/monitors/entity-monitor.factory.service';
import { PaginationMonitorFactory } from '../../../../../../../../core/src/shared/monitors/pagination-monitor.factory';
import { createBasicStoreModule } from '../../../../../../../../core/test-framework/store-test-helper';
import { CfUserServiceTestProvider } from '../../../../../../../../core/test-framework/user-service-helper';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { ActiveRouteCfOrgSpace } from '../../../../../../features/cloud-foundry/cf-page.types';
import { CfRolesService } from '../../../../../../features/cloud-foundry/users/manage-users/cf-roles.service';
import { CfRoleCheckboxComponent } from '../../../../cf-role-checkbox/cf-role-checkbox.component';
import { TableCellRoleOrgSpaceComponent } from './table-cell-org-space-role.component';

describe('TableCellSpaceRoleComponent', () => {
  let component: TableCellRoleOrgSpaceComponent;
  let fixture: ComponentFixture<TableCellRoleOrgSpaceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        CoreModule,
        createBasicStoreModule(),
        NoopAnimationsModule,
        HttpModule
      ],
      providers: [
        CfUserServiceTestProvider,
        CfRolesService,
        PaginationMonitorFactory,
        ActiveRouteCfOrgSpace,
        EntityMonitorFactory
      ],
      declarations: [
        TableCellRoleOrgSpaceComponent,
        CfRoleCheckboxComponent
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
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
