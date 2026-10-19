import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { SIGNAL, ReactiveNode } from '@angular/core/primitives/signals';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  EndpointModel,
  EndpointsDataService,
  entityCatalog,
  EntityCatalogHelper,
  EntityCatalogHelpers,
  generateStratosEntities,
} from '@stratosui/store';
import { seedEndpointsDataService, STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { TableCellEndpointNameComponent } from './table-cell-endpoint-name.component';

const endpointOne = { guid: 'ep-1', name: 'Endpoint One', connectionStatus: 'connected' } as EndpointModel;
const endpointTwo = { guid: 'ep-2', name: 'Endpoint Two', connectionStatus: 'disconnected' } as EndpointModel;

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

    seedEndpointsDataService([endpointOne, endpointTwo]);
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
