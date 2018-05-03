import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { ISpace } from '../../../../../../core/cf-api.types';
import { CoreModule } from '../../../../../../core/core.module';
import { ActiveRouteCfOrgSpace } from '../../../../../../features/cloud-foundry/cf-page.types';
import { CfRolesService } from '../../../../../../features/cloud-foundry/users/manage-users/cf-roles.service';
import { APIResource } from '../../../../../../store/types/api.types';
import { createBasicStoreModule } from '../../../../../../test-framework/store-test-helper';
import { CfUserService } from '../../../../../data-services/cf-user.service';
import { PaginationMonitorFactory } from '../../../../../monitors/pagination-monitor.factory';
import { CfRoleCheckboxComponent } from '../../../../cf-role-checkbox/cf-role-checkbox.component';
import { TableCellSpaceRoleComponent } from './table-cell-space-role.component';
import { EntityMonitorFactory } from '../../../../../monitors/entity-monitor.factory.service';

describe('TableCellSpaceRoleComponent', () => {
  let component: TableCellSpaceRoleComponent;
  let fixture: ComponentFixture<TableCellSpaceRoleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        CoreModule,
        createBasicStoreModule(),
        NoopAnimationsModule
      ],
      providers: [
        CfUserService,
        CfRolesService,
        PaginationMonitorFactory,
        ActiveRouteCfOrgSpace,
        EntityMonitorFactory
      ],
      declarations: [
        TableCellSpaceRoleComponent,
        CfRoleCheckboxComponent
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellSpaceRoleComponent);
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
