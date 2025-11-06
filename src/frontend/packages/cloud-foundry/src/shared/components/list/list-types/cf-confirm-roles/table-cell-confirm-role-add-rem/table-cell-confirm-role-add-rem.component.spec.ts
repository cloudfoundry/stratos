import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import { MDAppModule } from '../../../../../../../../core/src/core/md.module';
import {
  BooleanIndicatorComponent,
} from '../../../../../../../../core/src/shared/components/boolean-indicator/boolean-indicator.component';
import { OrgUserRoleNames } from '../../../../../../store/types/cf-user.types';
import { TableCellConfirmRoleAddRemComponent } from './table-cell-confirm-role-add-rem.component';

describe('TableCellConfirmRoleAddRemComponent', () => {
  let component: TableCellConfirmRoleAddRemComponent;
  let fixture: ComponentFixture<TableCellConfirmRoleAddRemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MDAppModule,
        TableCellConfirmRoleAddRemComponent
      ],
      declarations: [
        BooleanIndicatorComponent
      ]
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
