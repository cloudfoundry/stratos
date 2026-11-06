import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { EndpointModel } from '@stratosui/store';
import { createBasicStoreModule, CoreTestingModule } from '@test-framework';
import { CoreModule } from '../../../../core/core.module';
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

  it('should render the Expired label and icon for an expired connection', () => {
    // setInput (not a bare property write) - zoneless + OnPush only re-renders
    // when the input is set through the framework, which marks the view dirty.
    fixture.componentRef.setInput('row', {
      guid: 'test-guid',
      // Must be a CONNECTABLE endpoint type - the status branches (incl. the
      // expired one) render only inside the @if (connectable) block, and
      // unconnectable types (e.g. metrics) fall through to 'Unknown'.
      cnsi_type: 'cf',
      name: 'Test Endpoint',
      connectionStatus: 'expired',
    } as EndpointModel);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Expired');

    const icon = compiled.querySelector('app-custom-icon');
    expect(icon?.textContent?.trim()).toBe('endpoints_disconnected');
  });
});
