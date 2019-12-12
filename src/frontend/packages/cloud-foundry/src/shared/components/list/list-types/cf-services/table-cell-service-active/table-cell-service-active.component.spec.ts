import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCellServiceActiveComponent } from './table-cell-service-active.component';

describe('TableCellServiceActiveComponent', () => {
  let component: TableCellServiceActiveComponent;
  let fixture: ComponentFixture<TableCellServiceActiveComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TableCellServiceActiveComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellServiceActiveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
