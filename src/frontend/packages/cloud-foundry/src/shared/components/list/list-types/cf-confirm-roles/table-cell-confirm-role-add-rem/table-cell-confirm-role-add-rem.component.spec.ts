import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OrgUserRoleNames } from '../../../../../../../../cloud-foundry/src/store/types/user.types';
import { MDAppModule } from '../../../../../../../../core/src/core/md.module';
import {
  BooleanIndicatorComponent,
} from '../../../../../../../../core/src/shared/components/boolean-indicator/boolean-indicator.component';
import { TableCellConfirmRoleAddRemComponent } from './table-cell-confirm-role-add-rem.component';

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
