import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCellServiceNameComponent } from './table-cell-service-name.component';

describe('TableCellServiceNameComponent', () => {
  let component: TableCellServiceNameComponent;
  let fixture: ComponentFixture<TableCellServiceNameComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TableCellServiceNameComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellServiceNameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
