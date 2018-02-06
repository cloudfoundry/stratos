import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCellAppRouteComponent } from './table-cell-app-route.component';

describe('TableCellAppRouteComponent', () => {
  let component: TableCellAppRouteComponent;
  let fixture: ComponentFixture<TableCellAppRouteComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TableCellAppRouteComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellAppRouteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
