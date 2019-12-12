import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCellServiceCfBreadcrumbsComponent } from './table-cell-service-cf-breadcrumbs.component';

describe('TableCellServiceCfBreadcrumbsComponent', () => {
  let component: TableCellServiceCfBreadcrumbsComponent;
  let fixture: ComponentFixture<TableCellServiceCfBreadcrumbsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TableCellServiceCfBreadcrumbsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellServiceCfBreadcrumbsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
