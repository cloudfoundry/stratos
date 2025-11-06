import { HttpClientModule } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { EntityMonitorFactory } from '../../../../../../../../store/src/monitors/entity-monitor.factory.service';
import { PaginationMonitorFactory } from '../../../../../../../../store/src/monitors/pagination-monitor.factory';
import { generateCfStoreModules } from '../../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CfUserServiceTestProvider } from '../../../../../../../test-framework/user-service-helper';
import { ActiveRouteCfOrgSpace } from '../../../../../../features/cf/cf-page.types';
import { CfRolesService } from '../../../../../../features/cf/users/manage-users/cf-roles.service';
import { CfUserService } from '../../../../../data-services/cf-user.service';
import { TableCellSelectOrgComponent } from './table-cell-select-org.component';

describe('TableCellSelectOrgComponent', () => {
  let component: TableCellSelectOrgComponent;
  let fixture: ComponentFixture<TableCellSelectOrgComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ...generateCfStoreModules(),
        NoopAnimationsModule,
        HttpClientModule
      ],
      providers: [
        
        CfUserServiceTestProvider,
        CfRolesService,
        PaginationMonitorFactory,
        ActiveRouteCfOrgSpace,
        EntityMonitorFactory,
        CfUserService
      ,
        provideZonelessChangeDetection()
      ],
      declarations: [TableCellSelectOrgComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(TableCellSelectOrgComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
