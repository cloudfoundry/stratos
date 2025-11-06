import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { BaseTestModules } from '../../../../../../../test-framework/core-test.helper';
import { EndpointListHelper } from '../endpoint-list.helpers';
import { TableCellEndpointAddressComponent } from './table-cell-endpoint-address.component';

describe('TableCellEndpointAddressComponent', () => {
  let component: TableCellEndpointAddressComponent;
  let fixture: ComponentFixture<TableCellEndpointAddressComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...BaseTestModules],
      providers: [
        EndpointListHelper,
        provideZonelessChangeDetection()
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellEndpointAddressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
