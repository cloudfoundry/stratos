import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import { TableCellServiceProviderComponent } from './table-cell-service-provider.component';

describe('TableCellServiceProviderComponent', () => {
  let component: TableCellServiceProviderComponent;
  let fixture: ComponentFixture<TableCellServiceProviderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TableCellServiceProviderComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(TableCellServiceProviderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
