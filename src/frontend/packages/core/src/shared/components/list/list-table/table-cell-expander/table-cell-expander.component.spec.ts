import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCellExpanderComponent } from './table-cell-expander.component';

describe('TableCellExpanderComponent', () => {
  let component: TableCellExpanderComponent;
  let fixture: ComponentFixture<TableCellExpanderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TableCellExpanderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellExpanderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
