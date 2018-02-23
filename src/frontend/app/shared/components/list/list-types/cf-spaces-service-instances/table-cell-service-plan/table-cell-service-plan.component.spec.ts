import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCellServicePlanComponent } from './table-cell-service-plan.component';

describe('TableCellServicePlanComponent', () => {
  let component: TableCellServicePlanComponent;
  let fixture: ComponentFixture<TableCellServicePlanComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TableCellServicePlanComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellServicePlanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
