import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCellRequestMonitorIconComponent } from './table-cell-request-monitor-icon.component';

describe('TableCellRequestMonitorIconComponent', () => {
  let component: TableCellRequestMonitorIconComponent<any>;
  let fixture: ComponentFixture<TableCellRequestMonitorIconComponent<any>>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TableCellRequestMonitorIconComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellRequestMonitorIconComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
