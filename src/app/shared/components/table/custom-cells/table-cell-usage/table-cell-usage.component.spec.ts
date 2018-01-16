import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCellUsageComponent } from './table-cell-usage.component';

describe('TableCellUsageComponent', () => {
  let component: TableCellUsageComponent;
  let fixture: ComponentFixture<TableCellUsageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TableCellUsageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellUsageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
