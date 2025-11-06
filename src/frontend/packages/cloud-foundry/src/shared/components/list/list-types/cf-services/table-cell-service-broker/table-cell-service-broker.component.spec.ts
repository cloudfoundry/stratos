import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import { TableCellServiceBrokerComponent } from './table-cell-service-broker.component';

describe('TableCellServiceBrokerComponent', () => {
  let component: TableCellServiceBrokerComponent;
  let fixture: ComponentFixture<TableCellServiceBrokerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableCellServiceBrokerComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(TableCellServiceBrokerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
