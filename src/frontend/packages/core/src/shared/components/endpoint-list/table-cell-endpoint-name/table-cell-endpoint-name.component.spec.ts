import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { SIGNAL, ReactiveNode } from '@angular/core/primitives/signals';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  EndpointModel,
  EndpointsDataService,
  entityCatalog,
  EntityCatalogHelper,
  EntityCatalogHelpers,
  generateStratosEntities,
} from '@stratosui/store';
import { seedEndpointsDataService, STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { EndpointsService } from '../../../../core/endpoints.service';
import { TableCellEndpointNameComponent } from './table-cell-endpoint-name.component';

const endpointOne = { guid: 'ep-1', name: 'Endpoint One', connectionStatus: 'connected' } as EndpointModel;
const endpointTwo = { guid: 'ep-2', name: 'Endpoint Two', connectionStatus: 'disconnected' } as EndpointModel;
// Connected, but its type has no page of its own (GitHub, the autoscaler).
const endpointNoPage = { guid: 'ep-4', name: 'Endpoint No Page', connectionStatus: 'connected' } as EndpointModel;
const endpointShared = {
  guid: 'ep-3', name: 'Endpoint Shared', connectionStatus: 'connected', system_shared_token: true,
} as unknown as EndpointModel;

// Live consumers of the endpoints map signal: each is something that re-runs
// when the map changes. Read from the signal node because nothing public
// exposes it.
function liveConsumerCount(): number {
  const node = TestBed.inject(EndpointsDataService).endpoints[SIGNAL] as ReactiveNode;
  let count = 0;
  for (let link = node.consumers; link !== undefined; link = link.nextConsumer) {
    count++;
  }
  return count;
}

describe('TableCellEndpointNameComponent', () => {
  let component: TableCellEndpointNameComponent;
  let fixture: ComponentFixture<TableCellEndpointNameComponent>;

  beforeEach(() => {
    // Register stratos entities so `systemInfo`, `userFavorite`, etc. are
    // available to any catalog lookups exercised during the row render.
    // The endpoint schema itself no longer lives in the catalog — it ships
    // on the data source's action — so registration is no longer
    // load-bearing for endpoint lookups, but staying consistent with the
    // rest of the suite avoids surprising drift.
    (entityCatalog as any).clear();
    generateStratosEntities().forEach(entity => entityCatalog.register(entity));

    TestBed.configureTestingModule({
      imports: [
        TableCellEndpointNameComponent,
      ],
      providers: [
        ...STORE_TEST_PROVIDERS,
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
      ]
    });
    TestBed.compileComponents();

    // Initialize EntityCatalogHelper so components using stratosEntityCatalog.<entity>.store work
    const helper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(helper);

    seedEndpointsDataService([endpointOne, endpointTwo, endpointShared, endpointNoPage]);
    // The endpoint types' link builders are not registered here; give every
    // endpoint but ep-4 a page.
    vi.spyOn(EndpointsService, 'getLinkForEndpoint').mockImplementation(ep => ep.guid === 'ep-4' ? '' : `/ep/${ep.guid}`);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellEndpointNameComponent);
    component = fixture.componentInstance;
  });

  it('should create', async () => {
    fixture.componentRef.setInput('row', { guid: '' } as EndpointModel);
    await fixture.whenStable();
    expect(component).toBeTruthy();
  });

  it('renders the name of the endpoint the row points at', async () => {
    fixture.componentRef.setInput('row', { endpointId: 'ep-1' });
    await fixture.whenStable();

    const link = fixture.nativeElement.querySelector('a');
    expect(link?.textContent?.trim()).toBe('Endpoint One');
    expect(link?.getAttribute('href')).toBe('/ep/ep-1');
  });

  it('shows the name as plain text when the endpoint has no page', async () => {
    fixture.componentRef.setInput('row', endpointNoPage);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('a')).toBeNull();
    expect(fixture.nativeElement.querySelector('span')?.textContent?.trim()).toBe('Endpoint No Page');
  });

  it('marks a connection the administrator shares', async () => {
    fixture.componentRef.setInput('row', endpointShared);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('[aria-label="Shared by the administrator"]')).not.toBeNull();

    fixture.componentRef.setInput('row', endpointOne);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('[aria-label="Shared by the administrator"]')).toBeNull();
  });

  it('follows a new row and watches only the current one', async () => {
    fixture.componentRef.setInput('row', endpointOne);
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Endpoint One');

    fixture.componentRef.setInput('row', endpointTwo);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('a')).toBeNull();
    expect(fixture.nativeElement.querySelector('span')?.textContent?.trim()).toBe('Endpoint Two');

    // One watcher for the cell, not one per row it has ever shown.
    expect(liveConsumerCount()).toBe(1);

    fixture.destroy();
    expect(liveConsumerCount()).toBe(0);
  });
});
