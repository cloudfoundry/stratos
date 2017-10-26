import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCellEditComponent } from './table-cell-edit.component';

describe('TableCellEditComponent', () => {
  let component: TableCellEditComponent;
  let fixture: ComponentFixture<TableCellEditComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TableCellEditComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
