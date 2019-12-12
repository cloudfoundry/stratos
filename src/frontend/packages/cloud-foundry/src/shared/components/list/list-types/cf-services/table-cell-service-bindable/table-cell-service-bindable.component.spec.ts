import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCellServiceBindableComponent } from './table-cell-service-bindable.component';

describe('TableCellServiceBindableComponent', () => {
  let component: TableCellServiceBindableComponent;
  let fixture: ComponentFixture<TableCellServiceBindableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TableCellServiceBindableComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellServiceBindableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
