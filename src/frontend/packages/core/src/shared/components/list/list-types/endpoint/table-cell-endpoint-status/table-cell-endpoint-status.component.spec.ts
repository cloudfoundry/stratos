import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import type { EndpointModel } from '@stratosui/store';
import { createBasicStoreModule, CoreTestingModule } from '@test-framework';
import { CoreModule } from '../../../../../../core/core.module';
import { TableCellEndpointStatusComponent } from './table-cell-endpoint-status.component';

describe('TableCellEndpointStatusComponent', () => {
  let component: TableCellEndpointStatusComponent;
  let fixture: ComponentFixture<TableCellEndpointStatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      imports: [
        CoreTestingModule,
        createBasicStoreModule(),
        CoreModule,
        TableCellEndpointStatusComponent,
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellEndpointStatusComponent);
    component = fixture.componentInstance;
    component.row = {
      guid: 'test-guid',
      cnsi_type: 'metrics',
      name: 'Test Endpoint'
    } as EndpointModel;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
