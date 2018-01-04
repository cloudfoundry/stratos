import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCellAppStatusComponent } from './table-cell-app-status.component';

describe('TableCellAppStatusComponent', () => {
  let component: TableCellAppStatusComponent;
  let fixture: ComponentFixture<TableCellAppStatusComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TableCellAppStatusComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellAppStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
