import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { EndpointLastErrorService, EndpointModel, StratosCatalogEndpointEntity, entityCatalog } from '@stratosui/store';
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

  beforeEach(async () => {
    fixture = TestBed.createComponent(TableCellEndpointStatusComponent);
    component = fixture.componentInstance;
    component.row = {
      guid: 'test-guid',
      cnsi_type: 'metrics',
      name: 'Test Endpoint'
    } as EndpointModel;
    await fixture.whenStable();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should render the Expired label and icon for an expired connection', async () => {
    // setInput (not a bare property write) - zoneless + OnPush only re-renders
    // when the input is set through the framework, which marks the view dirty.
    fixture.componentRef.setInput('row', {
      guid: 'test-guid',
      // Must be a connectable endpoint type: the status branches (incl. the
      // expired one) render only inside the @if (connectable) block.
      cnsi_type: 'cf',
      name: 'Test Endpoint',
      connectionStatus: 'expired',
    } as EndpointModel);
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Expired');

    const icon = compiled.querySelector('app-custom-icon');
    expect(icon?.textContent?.trim()).toBe('endpoints_disconnected');
  });

  // A failed connect leaves the endpoint Disconnected; the card says why the
  // last attempt failed, as the last error.
  it('tells why the last connect failed on a disconnected endpoint', async () => {
    TestBed.inject(EndpointLastErrorService).record('test-guid', 'Could not connect to the endpoint (400)');
    fixture.componentRef.setInput('row', {
      guid: 'test-guid', cnsi_type: 'cf', name: 'Test Endpoint', connectionStatus: 'disconnected',
    } as EndpointModel);
    await fixture.whenStable();

    const text = (fixture.nativeElement as HTMLElement).textContent;
    expect(text).toContain('Disconnected');
    expect(text).toContain('The last error was Could not connect to the endpoint (400). Reconnect to get the latest status.');
  });

  // A type that needs no login shows its sync status (as the list does).
  it('shows the sync status of a type that needs no login', async () => {
    entityCatalog.register(new StratosCatalogEndpointEntity({
      type: 'test-no-login', label: 'No login', labelPlural: 'No login', logoUrl: '', authTypes: [], unConnectable: true,
    }));
    const repoFixture = TestBed.createComponent(TableCellEndpointStatusComponent);
    repoFixture.componentInstance.row = {
      guid: 'repo-1', cnsi_type: 'test-no-login', name: 'repo', connectionStatus: 'disconnected',
      endpoint_metadata: { status: 'Pending' },
    } as EndpointModel;
    await repoFixture.whenStable();
    const text = (repoFixture.nativeElement as HTMLElement).textContent;
    expect(text).toContain('Sync Pending');
    expect(text).not.toContain('Disconnected');
  });

  // Same placeholder as the endpoints list when there is no sync status.
  it('shows the list\'s placeholder when a type that needs no login has no sync status', async () => {
    entityCatalog.register(new StratosCatalogEndpointEntity({
      type: 'test-no-login', label: 'No login', labelPlural: 'No login', logoUrl: '', authTypes: [], unConnectable: true,
    }));
    const repoFixture = TestBed.createComponent(TableCellEndpointStatusComponent);
    repoFixture.componentInstance.row = {
      guid: 'repo-2', cnsi_type: 'test-no-login', name: 'repo', connectionStatus: 'disconnected',
    } as EndpointModel;
    await repoFixture.whenStable();
    expect((repoFixture.nativeElement as HTMLElement).textContent?.trim()).toBe('—');
  });
});
