import { provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EndpointsSignalService } from '@stratosui/core';
import { EndpointModel } from '@stratosui/store';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EndpointDataRegistry } from '../../services/endpoint-data/endpoint-data.registry';
import { FoundationShapePageComponent } from './foundation-shape-page.component';
import { app, org, space } from './testing/entity-builders';

const cfEndpoint = { guid: 'cf-1', name: 'My Cloud Foundry', cnsi_type: 'cf' } as EndpointModel;
const nonCfEndpoint = { guid: 'k8s-1', name: 'My Kube', cnsi_type: 'k8s' } as EndpointModel;

/** Writable-signal stand-in for the EndpointDataService surface the page reads. */
const fakeDataService = () => ({
  orgs: signal([org('o1'), org('o2')]),
  spaces: signal([space('s1', 'o1'), space('s2', 'o1')]),
  apps: signal([
    app('a1', { spaceGuid: 's1', orgGuid: 'o1', memory: 256, diskQuota: 1024, stackName: 'cflinuxfs4' }),
  ]),
  orgCount: signal(2),
  appCount: signal(1),
  routeCount: signal(5),
  serviceInstancesCount: signal(3),
  serviceOfferingsCount: signal(4),
  servicePlansCount: signal(6),
  serviceBrokersCount: signal(1),
  orgsLastFetched: signal<Date | null>(new Date('2026-08-01T10:00:00Z')),
  appsLastFetched: signal<Date | null>(new Date('2026-08-01T10:00:00Z')),
  spacesLastFetched: signal<Date | null>(new Date('2026-08-01T10:00:00Z')),
  orgsStale: signal(false),
  appsStale: signal(false),
  spacesStale: signal(false),
  isLoadingDetails: signal(false),
});

describe('FoundationShapePageComponent', () => {
  let fixture: ComponentFixture<FoundationShapePageComponent>;
  let component: FoundationShapePageComponent;
  let services: Map<string, ReturnType<typeof fakeDataService>>;
  let registry: { acquire: ReturnType<typeof vi.fn>; release: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    services = new Map();
    registry = {
      acquire: vi.fn((guid: string) => {
        if (!services.has(guid)) {
          services.set(guid, fakeDataService());
        }
        return services.get(guid);
      }),
      release: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [FoundationShapePageComponent],
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: EndpointsSignalService,
          useValue: { connectedEndpoints: signal<EndpointModel[]>([cfEndpoint, nonCfEndpoint]) },
        },
        { provide: EndpointDataRegistry, useValue: registry },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FoundationShapePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('acquires a data service per connected CF endpoint and skips non-CF', () => {
    expect(registry.acquire).toHaveBeenCalledTimes(1);
    expect(registry.acquire).toHaveBeenCalledWith('cf-1');
  });

  it('releases acquired services on destroy', () => {
    fixture.destroy();
    expect(registry.release).toHaveBeenCalledWith('cf-1');
  });

  it('derives the session shape from the registry signals', () => {
    const section = component.sections()[0];
    expect(section.guid).toBe('cf-1');
    expect(section.name).toBe('My Cloud Foundry');
    expect(section.shape.distributions.spaces_per_org).toMatchObject({ n: 2, sum: 2, zeros: 1 });
    expect(section.shape.composition.stacks_pinned_by_apps).toEqual({ cflinuxfs4: 1 });
  });

  it('reports totals from the fast counts and the drained spaces list', () => {
    const section = component.sections()[0];
    expect(section.totals).toMatchObject({ orgs: 2, apps: 1, routes: 5, spaces: 2, serviceBrokers: 1 });
  });

  it('renders the endpoint name', () => {
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('My Cloud Foundry');
  });

  it('flags never-loaded drains as null spaces total, distinct from empty', async () => {
    const svc = services.get('cf-1');
    svc.spaces.set([]);
    svc.spacesLastFetched.set(null);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.sections()[0].totals.spaces).toBeNull();
  });
});
