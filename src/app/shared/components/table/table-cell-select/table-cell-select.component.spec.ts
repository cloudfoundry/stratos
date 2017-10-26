import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCellSelectComponent } from './table-cell-select.component';

describe('TableCellSelectComponent', () => {
  let component: TableCellSelectComponent;
  let fixture: ComponentFixture<TableCellSelectComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TableCellSelectComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
