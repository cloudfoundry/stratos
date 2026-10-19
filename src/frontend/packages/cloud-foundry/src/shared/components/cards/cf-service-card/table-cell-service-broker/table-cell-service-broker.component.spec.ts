import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { Observable, Subject, of } from 'rxjs';
import { describe, it, expect, beforeEach } from 'vitest';

import { TableCellServiceBrokerComponent, TableCellServiceBrokerComponentMode } from './table-cell-service-broker.component';
import { ServiceCatalogDataService, SignalSource } from '../../../../../services/endpoint-data/service-catalog-data.service';
import { SpaceDataRegistry } from '../../../../../services/endpoint-data/space-data.registry';
import { StServiceBroker, StServiceOffering, StSpace } from '../../../../../services/endpoint-data/stratos-types';

// Space lookup lands after the first render, the same as the real
// SpaceDataService: `space` stays null until `load()` emits.
class SpaceDataRegistryStub {
  readonly space = signal<StSpace | null>(null);
  readonly loaded = new Subject<void>();
  // One entry per load() subscription; `closed` flips when it ends.
  loads: { key: string, closed: boolean }[] = [];

  acquire(cnsi: string, spaceGuid: string) {
    const key = `${cnsi}/${spaceGuid}`;
    return {
      space: this.space.asReadonly(),
      // Reads `space` the way the real load() checks its cache.
      load: (): Observable<void> => this.space() ? of(undefined) : new Observable<void>(subscriber => {
        const load = { key, closed: false };
        this.loads.push(load);
        const inner = this.loaded.subscribe(subscriber);
        return () => {
          load.closed = true;
          inner.unsubscribe();
        };
      }),
    };
  }
}

describe('TableCellServiceBrokerComponent', () => {
  let component: TableCellServiceBrokerComponent;
  let fixture: ComponentFixture<TableCellServiceBrokerComponent>;
  let lastBrokerLookup: { cnsiGuid: string; brokerGuid: string } | null;
  let lateBroker: ReturnType<typeof signal<StServiceBroker | null>> | null;
  let spaceStub: SpaceDataRegistryStub;

  beforeEach(async () => {
    lastBrokerLookup = null;
    lateBroker = null;
    spaceStub = new SpaceDataRegistryStub();
    const serviceCatalogStub: Partial<ServiceCatalogDataService> = {
      serviceBroker: (cnsiGuid: string, brokerGuid: string): SignalSource<StServiceBroker | null> => {
        lastBrokerLookup = { cnsiGuid, brokerGuid };
        const broker: StServiceBroker = {
          guid: brokerGuid,
          name: 'global-broker',
          url: 'https://b.example',
          space: undefined,
          labels: {},
          annotations: {},
          cnsiGuid,
          createdAt: '',
          updatedAt: '',
        };
        return {
          value: (lateBroker ?? signal<StServiceBroker | null>(broker)).asReadonly(),
          isLoading: signal(false).asReadonly(),
          error: signal<HttpErrorResponse | null>(null).asReadonly(),
        };
      },
    };

    await TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: ServiceCatalogDataService, useValue: serviceCatalogStub },
        { provide: SpaceDataRegistry, useValue: spaceStub },
      ],
      imports: [TableCellServiceBrokerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TableCellServiceBrokerComponent);
    component = fixture.componentInstance;
  });

  it('should create', async () => {
    await fixture.whenStable();
    expect(component).toBeTruthy();
  });

  it('resolves broker via ServiceCatalogDataService when row is assigned', async () => {
    component.config = { mode: TableCellServiceBrokerComponentMode.NAME };
    const offering: StServiceOffering = {
      guid: 'svc-1',
      cnsiGuid: 'cnsi-1',
      name: 'svc',
      broker: { guid: 'broker-7' },
      createdAt: '2026-01-01T00:00:00Z',
    };
    component.row = offering;
    await fixture.whenStable();

    expect(lastBrokerLookup).toEqual({ cnsiGuid: 'cnsi-1', brokerGuid: 'broker-7' });
    expect(component.broker()?.name).toBe('global-broker');
  });

  it('renders the space link once the broker and its space land', async () => {
    lateBroker = signal<StServiceBroker | null>(null);
    component.config = { mode: TableCellServiceBrokerComponentMode.SCOPE };
    component.row = {
      guid: 'svc-1',
      cnsiGuid: 'cnsi-1',
      name: 'svc',
      broker: { guid: 'broker-7' },
      createdAt: '2026-01-01T00:00:00Z',
    };
    await fixture.whenStable();
    const host: HTMLElement = fixture.nativeElement;
    expect(host.textContent?.trim()).toBe('-');

    lateBroker.set({
      guid: 'broker-7',
      name: 'space-broker',
      url: 'https://b.example',
      space: { guid: 'space-1' },
      labels: {},
      annotations: {},
      cnsiGuid: 'cnsi-1',
      createdAt: '',
      updatedAt: '',
    });
    // Read before the space-acquire effect runs: the computed must still
    // pick up the space data the effect swaps in afterwards.
    expect(component.spaceLink()).toBeNull();
    await fixture.whenStable();
    expect(host.textContent).toContain('All Spaces');

    spaceStub.space.set({ guid: 'space-1', name: 'broker-space', orgGuid: 'org-1' } as StSpace);
    spaceStub.loaded.next();
    await fixture.whenStable();

    // The space landing must not start a second load.
    expect(spaceStub.loads).toEqual([{ key: 'cnsi-1/space-1', closed: false }]);
    const link = host.querySelector('a');
    expect(link?.textContent).toBe('broker-space');
    expect(link?.getAttribute('href')).toBe('/cloud-foundry/cnsi-1/organizations/org-1/spaces/space-1/summary');
  });

  it('ends the previous space load when the space swaps, and the current one on destroy', async () => {
    const inSpace = (guid: string): StServiceBroker => ({
      guid: 'broker-7',
      name: 'space-broker',
      url: 'https://b.example',
      space: { guid },
      labels: {},
      annotations: {},
      cnsiGuid: 'cnsi-1',
      createdAt: '',
      updatedAt: '',
    });
    lateBroker = signal<StServiceBroker | null>(inSpace('space-a'));
    component.config = { mode: TableCellServiceBrokerComponentMode.SCOPE };
    component.row = {
      guid: 'svc-1',
      cnsiGuid: 'cnsi-1',
      name: 'svc',
      broker: { guid: 'broker-7' },
      createdAt: '2026-01-01T00:00:00Z',
    };
    await fixture.whenStable();
    expect(spaceStub.loads).toEqual([{ key: 'cnsi-1/space-a', closed: false }]);

    // Swap while the first load is still pending.
    lateBroker.set(inSpace('space-b'));
    await fixture.whenStable();
    expect(spaceStub.loads).toEqual([
      { key: 'cnsi-1/space-a', closed: true },
      { key: 'cnsi-1/space-b', closed: false },
    ]);

    fixture.destroy();
    expect(spaceStub.loads.every(load => load.closed)).toBe(true);
  });
});
