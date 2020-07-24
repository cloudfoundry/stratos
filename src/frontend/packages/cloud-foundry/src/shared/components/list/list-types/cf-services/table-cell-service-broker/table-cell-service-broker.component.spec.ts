import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCellServiceBrokerComponent } from './table-cell-service-broker.component';

describe('TableCellServiceBrokerComponent', () => {
  let component: TableCellServiceBrokerComponent;
  let fixture: ComponentFixture<TableCellServiceBrokerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TableCellServiceBrokerComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellServiceBrokerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
