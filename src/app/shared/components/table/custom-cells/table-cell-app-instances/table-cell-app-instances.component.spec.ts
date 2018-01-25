import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCellAppInstancesComponent } from './table-cell-app-instances.component';

describe('TableCellAppInstancesComponent', () => {
  let component: TableCellAppInstancesComponent;
  let fixture: ComponentFixture<TableCellAppInstancesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TableCellAppInstancesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellAppInstancesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
