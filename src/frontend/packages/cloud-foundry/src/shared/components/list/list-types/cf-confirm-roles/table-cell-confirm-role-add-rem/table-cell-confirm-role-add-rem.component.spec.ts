import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';

import { MDAppModule } from '@stratosui/core';
import {
  BooleanIndicatorComponent,
} from '@stratosui/core';
import { OrgUserRoleNames } from '../../../../../../store/types/cf-user.types';
import { TableCellConfirmRoleAddRemComponent } from './table-cell-confirm-role-add-rem.component';

describe('TableCellConfirmRoleAddRemComponent', () => {
  let component: TableCellConfirmRoleAddRemComponent;
  let fixture: ComponentFixture<TableCellConfirmRoleAddRemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      imports: [
        BooleanIndicatorComponent,
        MDAppModule,
        TableCellConfirmRoleAddRemComponent,
      ],
      
    })
      .compileComponents();

    fixture = TestBed.createComponent(TableCellConfirmRoleAddRemComponent);
    component = fixture.componentInstance;
    component.row = {
      username: '',
      userGuid: '',
      orgName: '',
      orgGuid: '',
      roleName: '',
      add: false,
      role: OrgUserRoleNames.AUDITOR,
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
