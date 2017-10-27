import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCellEditVariableComponent } from './table-cell-edit-variable.component';

describe('TableCellEditVariableComponent', () => {
  let component: TableCellEditVariableComponent;
  let fixture: ComponentFixture<TableCellEditVariableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TableCellEditVariableComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellEditVariableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
