import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCellConfirmRoleAddRemComponent } from './table-cell-confirm-role-add-rem.component';

describe('TableCellConfirmRoleAddRemComponent', () => {
  let component: TableCellConfirmRoleAddRemComponent;
  let fixture: ComponentFixture<TableCellConfirmRoleAddRemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TableCellConfirmRoleAddRemComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellConfirmRoleAddRemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
