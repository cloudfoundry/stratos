import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCellConfirmOrgSpaceComponent } from './table-cell-confirm-org-space.component';

describe('TableCellConfirmOrgSpaceComponent', () => {
  let component: TableCellConfirmOrgSpaceComponent;
  let fixture: ComponentFixture<TableCellConfirmOrgSpaceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TableCellConfirmOrgSpaceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellConfirmOrgSpaceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
