import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCellRouteComponent } from './table-cell-route.component';

describe('TableCellRouteComponent', () => {
  let component: TableCellRouteComponent;
  let fixture: ComponentFixture<TableCellRouteComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TableCellRouteComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellRouteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
