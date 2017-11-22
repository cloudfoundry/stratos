import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCellActionsComponent } from './table-cell-actions.component';

describe('TableCellActionsComponent', () => {
  let component: TableCellActionsComponent;
  let fixture: ComponentFixture<TableCellActionsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TableCellActionsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellActionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
