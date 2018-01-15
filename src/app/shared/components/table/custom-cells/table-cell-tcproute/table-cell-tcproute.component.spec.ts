import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCellTcprouteComponent } from './table-cell-tcproute.component';

describe('TableCellTcprouteComponent', () => {
  let component: TableCellTcprouteComponent;
  let fixture: ComponentFixture<TableCellTcprouteComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TableCellTcprouteComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellTcprouteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
