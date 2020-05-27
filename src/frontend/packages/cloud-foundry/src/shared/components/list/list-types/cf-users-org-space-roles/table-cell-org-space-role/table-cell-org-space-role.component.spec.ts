import { HttpClientModule } from '@angular/common/http';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { CoreModule } from '../../../../../../../../core/src/core/core.module';
import { EntityMonitorFactory } from '../../../../../../../../store/src/monitors/entity-monitor.factory.service';
import { PaginationMonitorFactory } from '../../../../../../../../store/src/monitors/pagination-monitor.factory';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { generateCfStoreModules } from '../../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CfUserServiceTestProvider } from '../../../../../../../test-framework/user-service-helper';
import { ISpace } from '../../../../../../cf-api.types';
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
        ...generateCfStoreModules(),
        CoreModule,
        NoopAnimationsModule,
        HttpClientModule
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
