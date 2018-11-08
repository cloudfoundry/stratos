import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCellConfirmRoleAddRemComponent } from './table-cell-confirm-role-add-rem.component';
import { BooleanIndicatorComponent } from '../../../../boolean-indicator/boolean-indicator.component';
import { MDAppModule } from '../../../../../../core/md.module';
import { OrgUserRoleNames } from '../../../../../../../../store/src/types/user.types';

describe('TableCellConfirmRoleAddRemComponent', () => {
  let component: TableCellConfirmRoleAddRemComponent;
  let fixture: ComponentFixture<TableCellConfirmRoleAddRemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        MDAppModule,
      ],
      declarations: [
        TableCellConfirmRoleAddRemComponent,
        BooleanIndicatorComponent
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellConfirmRoleAddRemComponent);
    component = fixture.componentInstance;
    component.row = {
      userName: '',
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
