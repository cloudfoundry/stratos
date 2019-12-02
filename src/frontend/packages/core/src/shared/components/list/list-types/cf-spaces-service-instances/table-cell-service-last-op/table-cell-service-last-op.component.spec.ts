import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCellServiceLastOpComponent } from './table-cell-service-last-op.component';

describe('TableCellServiceLastOpComponent', () => {
  let component: TableCellServiceLastOpComponent;
  let fixture: ComponentFixture<TableCellServiceLastOpComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TableCellServiceLastOpComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellServiceLastOpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
