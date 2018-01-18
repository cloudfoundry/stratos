import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCellTCPRouteComponent } from './table-cell-tcproute.component';

describe('TableCellTCPRouteComponent', () => {
  let component: TableCellTCPRouteComponent<any>;
  let fixture: ComponentFixture<TableCellTCPRouteComponent<any>>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TableCellTCPRouteComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellTCPRouteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
