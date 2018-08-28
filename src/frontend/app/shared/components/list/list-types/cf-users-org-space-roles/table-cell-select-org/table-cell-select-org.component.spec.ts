import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpModule } from '@angular/http';

import { TableCellSelectOrgComponent } from './table-cell-select-org.component';
import { CoreModule } from '../../../../../../core/core.module';
import { createBasicStoreModule } from '../../../../../../test-framework/store-test-helper';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { CfRolesService } from '../../../../../../features/cloud-foundry/users/manage-users/cf-roles.service';
import { ActiveRouteCfOrgSpace } from '../../../../../../features/cloud-foundry/cf-page.types';
import { CfUserService } from '../../../../../data-services/cf-user.service';
import { PaginationMonitorFactory } from '../../../../../monitors/pagination-monitor.factory';
import { EntityMonitorFactory } from '../../../../../monitors/entity-monitor.factory.service';
import { CfUserServiceTestProvider } from '../../../../../../test-framework/user-service-helper';

describe('TableCellSelectOrgComponent', () => {
  let component: TableCellSelectOrgComponent;
  let fixture: ComponentFixture<TableCellSelectOrgComponent>;

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
      declarations: [TableCellSelectOrgComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellSelectOrgComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
