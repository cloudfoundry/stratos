import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCellServiceComponent } from './table-cell-service.component';

describe('TableCellServiceComponent', () => {
  let component: TableCellServiceComponent;
  let fixture: ComponentFixture<TableCellServiceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TableCellServiceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellServiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
