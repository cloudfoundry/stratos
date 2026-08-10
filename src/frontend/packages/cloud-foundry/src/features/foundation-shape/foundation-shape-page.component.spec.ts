import { provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmationDialogService, EndpointsSignalService } from '@stratosui/core';
import { EndpointModel } from '@stratosui/store';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EndpointDataRegistry } from '../../services/endpoint-data/endpoint-data.registry';
import { FoundationShapePageComponent } from './foundation-shape-page.component';
import { MeasuredEcosystem, MeasuredRoles, MeasuredTotals, ShapeMeasureService } from './shape-measure.service';
import { app, binding, org, serviceInstance, space, user } from './testing/entity-builders';

const cfEndpoint = { guid: 'cf-1', name: 'My Cloud Foundry', cnsi_type: 'cf' } as EndpointModel;
const adminCfEndpoint = {
  guid: 'cf-1',
  name: 'My Cloud Foundry',
  cnsi_type: 'cf',
  user: { guid: 'u1', name: 'admin', admin: true },
} as EndpointModel;
const nonCfEndpoint = { guid: 'k8s-1', name: 'My Kube', cnsi_type: 'k8s' } as EndpointModel;

/** Writable-signal stand-in for the EndpointDataService surface the page reads. */
const fakeDataService = () => ({
  lastFetched: signal<Date | null>(new Date('2026-08-01T10:00:00Z')),
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
  servicesCountsLastFetched: signal<Date | null>(new Date('2026-08-01T10:00:00Z')),
  servicesDetailsLastFetched: signal<Date | null>(null),
  serviceInstances: signal([serviceInstance('si1', 's1')]),
  serviceCredentialBindings: signal([binding('b1', 'a1', 'si1')]),
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
  let endpoints: ReturnType<typeof signal<EndpointModel[]>>;
  let measure: {
    totals: ReturnType<typeof signal<ReadonlyMap<string, MeasuredTotals>>>;
    ecosystem: ReturnType<typeof signal<ReadonlyMap<string, MeasuredEcosystem>>>;
    roles: ReturnType<typeof signal<ReadonlyMap<string, MeasuredRoles>>>;
    inFlight: ReturnType<typeof signal<ReadonlySet<string>>>;
    totalsCost: () => string;
    ecosystemCost: () => string;
    rolesCost: () => string;
    measureTotals: ReturnType<typeof vi.fn>;
    measureEcosystem: ReturnType<typeof vi.fn>;
    measureRoles: ReturnType<typeof vi.fn>;
  };
  /** Records the confirm config and lets a test decide whether the user confirms. */
  let confirmed: { config: { title: string; message: string } | null; accept: boolean };

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
    measure = {
      totals: signal<ReadonlyMap<string, MeasuredTotals>>(new Map()),
      ecosystem: signal<ReadonlyMap<string, MeasuredEcosystem>>(new Map()),
      roles: signal<ReadonlyMap<string, MeasuredRoles>>(new Map()),
      inFlight: signal<ReadonlySet<string>>(new Set()),
      totalsCost: () => '8 requests',
      ecosystemCost: () => '2 requests',
      rolesCost: () => '1 request',
      measureTotals: vi.fn(),
      measureEcosystem: vi.fn(),
      measureRoles: vi.fn(),
    };
    confirmed = { config: null, accept: true };

    await TestBed.configureTestingModule({
      imports: [FoundationShapePageComponent],
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: EndpointsSignalService,
          useValue: { connectedEndpoints: (endpoints = signal<EndpointModel[]>([cfEndpoint, nonCfEndpoint])) },
        },
        { provide: EndpointDataRegistry, useValue: registry },
        { provide: ShapeMeasureService, useValue: measure },
        {
          provide: ConfirmationDialogService,
          useValue: {
            open: (config: { title: string; message: string }, doFn: () => void) => {
              confirmed.config = config;
              if (confirmed.accept) {
                doFn();
              }
            },
          },
        },
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

  it('always shows all three concentration tiles, naming the missing ones', async () => {
    const withData = component.concentrationTiles(component.sections()[0]);
    expect(withData).toHaveLength(3);
    expect(withData.every(tile => tile.headline !== null)).toBe(true);

    const svc = services.get('cf-1');
    svc.apps.set([]);
    fixture.detectChanges();
    await fixture.whenStable();
    const withoutApps = component.concentrationTiles(component.sections()[0]);
    expect(withoutApps).toHaveLength(3);
    // apps-based tiles lose their headline but stay visible
    expect(withoutApps.filter(tile => tile.headline === null)).toHaveLength(2);
    const rendered = (fixture.nativeElement as HTMLElement).querySelector('[data-test="shape-concentration"]');
    expect(rendered?.textContent).toContain('no data');
  });

  it('renders app state as one segment per actual state, all summing to 100%', () => {
    const parts = component.appStateParts(component.sections()[0]);
    expect(parts).toEqual([{ label: 'STARTED', value: 1 }]);
  });

  it('flags never-loaded drains as null spaces total, distinct from empty', async () => {
    const svc = services.get('cf-1');
    svc.spaces.set([]);
    svc.spacesLastFetched.set(null);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.sections()[0].totals.spaces).toBeNull();
  });

  it('shows dashes, not zeros, when the fast counts never loaded', async () => {
    const svc = services.get('cf-1');
    svc.lastFetched.set(null);
    fixture.detectChanges();
    await fixture.whenStable();
    const totals = (fixture.nativeElement as HTMLElement).querySelector('[data-test="shape-totals"]');
    expect(totals?.textContent).not.toContain('0 orgs');
    expect(totals?.textContent).toContain('— orgs');
  });

  it('shows dashes for service counts until their own counts fetch lands', async () => {
    const svc = services.get('cf-1');
    svc.servicesCountsLastFetched.set(null);
    fixture.detectChanges();
    await fixture.whenStable();
    const totals = (fixture.nativeElement as HTMLElement).querySelector('[data-test="shape-totals"]');
    expect(totals?.textContent).toContain('— brokers');
    expect(totals?.textContent).toContain('2 orgs');
  });

  describe('measure on demand', () => {
    it('states each block cost before it runs', () => {
      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(text).toContain('8 requests');
      expect(text).toContain('2 requests');
    });

    it('starts a totals measurement for the section endpoint on click', async () => {
      const button = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('[data-test="measure-totals"]');
      button.click();
      await fixture.whenStable();
      expect(measure.measureTotals).toHaveBeenCalledWith('cf-1');
    });

    it('renders measured ecosystem totals with their timestamp once available', async () => {
      measure.totals.set(new Map([
        ['cf-1', {
          counts: { buildpacks: 24, stacks: 2, isolation_segments: 1, domains: 4, organization_quotas: 11, space_quotas: 3, security_groups: null, users: 14 },
          fetchedAt: new Date(),
        }],
      ]));
      fixture.detectChanges();
      await fixture.whenStable();
      const strip = (fixture.nativeElement as HTMLElement).querySelector('[data-test="measured-totals"]');
      expect(strip?.textContent).toContain('24');
      expect(strip?.textContent).toContain('Org quotas');
      expect(strip?.textContent).toContain('unavailable');
    });

    it('hides export for non-admin endpoint connections', () => {
      expect((fixture.nativeElement as HTMLElement).querySelector('[data-test="shape-export"]')).toBeNull();
    });

    it('shows export to a CF admin and builds a schema_version 1 payload', async () => {
      endpoints.set([adminCfEndpoint]);
      fixture.detectChanges();
      await fixture.whenStable();
      expect((fixture.nativeElement as HTMLElement).querySelector('[data-test="shape-export"]')).not.toBeNull();

      const payload = component.exportPayload(component.sections()[0]);
      expect(payload.schema_version).toBe(1);
      expect(payload.totals['organizations']).toBe(2);
      expect(payload.totals['spaces']).toBe(2);
      expect(payload.distributions.spaces_per_org).toMatchObject({ n: 2 });
    });

    it('shows compact bar stats from loaded data', () => {
      const bar = (fixture.nativeElement as HTMLElement).querySelector('[data-test="section-bar-stats"]');
      expect(bar?.textContent).toContain('1 apps');
      expect(bar?.textContent).toContain('100.0% started');
    });

    it('starts expanded with a single endpoint and collapses on bar toggle', async () => {
      const root = fixture.nativeElement as HTMLElement;
      expect(root.querySelector('[data-test="shape-totals"]')).not.toBeNull();
      root.querySelector<HTMLButtonElement>('[data-test="section-toggle"]').click();
      await fixture.whenStable();
      expect(root.querySelector('[data-test="shape-totals"]')).toBeNull();
      root.querySelector<HTMLButtonElement>('[data-test="section-toggle"]').click();
      await fixture.whenStable();
      expect(root.querySelector('[data-test="shape-totals"]')).not.toBeNull();
    });

    it('collapses by default with several endpoints; selecting two shows the compare strip', async () => {
      endpoints.set([cfEndpoint, { guid: 'cf-2', name: 'Second CF', cnsi_type: 'cf' } as EndpointModel]);
      fixture.detectChanges();
      await fixture.whenStable();
      const root = fixture.nativeElement as HTMLElement;
      expect(root.querySelector('[data-test="shape-totals"]')).toBeNull();
      expect(root.querySelector('[data-test="compare-now-strip"]')).toBeNull();

      const boxes = root.querySelectorAll<HTMLInputElement>('[data-test="compare-select"]');
      expect(boxes).toHaveLength(2);
      boxes[0].click();
      boxes[1].click();
      await fixture.whenStable();
      const strip = root.querySelector('[data-test="compare-now-strip"]');
      expect(strip?.textContent).toContain('2 sides selected');
      expect(root.querySelector('[data-test="compare-totals"]')).not.toBeNull();
      // each selected bar shows its side's identity color chip
      expect(root.querySelectorAll('[data-test="compare-select-dot"]')).toHaveLength(2);
    });

    it('starts a roles measurement, stating its single-request cost', async () => {
      expect((fixture.nativeElement as HTMLElement).textContent).toContain('1 request');
      (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('[data-test="measure-roles"]').click();
      await fixture.whenStable();
      expect(measure.measureRoles).toHaveBeenCalledWith('cf-1');
    });

    it('renders defined stacks and buildpacks with unused stacks called out', async () => {
      measure.ecosystem.set(new Map([
        ['cf-1', {
          stacksDefined: ['cflinuxfs4', 'cflinuxfs3'],
          buildpacksDefined: ['ruby_buildpack', 'go_buildpack'],
          fetchedAt: new Date(),
        }],
      ]));
      fixture.detectChanges();
      await fixture.whenStable();
      const panel = (fixture.nativeElement as HTMLElement).querySelector('[data-test="measured-ecosystem"]');
      // Session apps pin only cflinuxfs4, so cflinuxfs3 is defined-but-unused.
      expect(panel?.textContent).toContain('cflinuxfs3');
      expect(panel?.textContent).toContain('unused');
      expect(panel?.textContent).toContain('ruby_buildpack');
    });
  });

  describe('detail (named) export', () => {
    const clickDetailExport = async () => {
      endpoints.set([adminCfEndpoint]);
      fixture.detectChanges();
      await fixture.whenStable();
      (fixture.nativeElement as HTMLElement)
        .querySelector<HTMLButtonElement>('[data-test="export-detail-json"]')
        .click();
      await fixture.whenStable();
    };

    beforeEach(() => {
      // jsdom has no download implementation; the click is all this asserts on.
      // Cleared per test — spying the same method twice reuses one mock, so
      // call history would otherwise carry over from the previous test.
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test').mockClear();
      vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined).mockClear();
    });

    it('stays hidden from a non-admin connection, alongside the anonymous export', () => {
      expect((fixture.nativeElement as HTMLElement).querySelector('[data-test="shape-export-detail"]')).toBeNull();
    });

    it('names the endpoint, the orgs and the apps in the tree', async () => {
      endpoints.set([adminCfEndpoint]);
      fixture.detectChanges();
      await fixture.whenStable();

      const payload = component.detailPayload(component.sections()[0]);
      expect(payload?.mode).toBe('detail');
      expect(payload?.endpoint).toEqual({ guid: 'cf-1', name: 'My Cloud Foundry' });
      expect(payload?.organizations.map(o => o.name)).toEqual(['org-o1', 'org-o2']);
      expect(payload?.organizations[0].spaces?.map(s => s.name)).toEqual(['space-s1', 'space-s2']);
      expect(payload?.organizations[0].spaces?.[0].apps?.[0]).toMatchObject({ name: 'app-a1', memory_mb: 256 });
    });

    it('refuses to build a tree before the orgs drain has run', async () => {
      endpoints.set([adminCfEndpoint]);
      fixture.detectChanges();
      await fixture.whenStable();
      services.get('cf-1').orgsLastFetched.set(null);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.canExportDetail(component.sections()[0])).toBe(false);
      expect(component.detailPayload(component.sections()[0])).toBeNull();
      const button = (fixture.nativeElement as HTMLElement)
        .querySelector<HTMLButtonElement>('[data-test="export-detail-json"]');
      expect(button.disabled).toBe(true);
    });

    it('asks for confirmation naming what leaves the browser', async () => {
      await clickDetailExport();
      expect(confirmed.config?.title).toBe('Export named foundation data');
      expect(confirmed.config?.message).toContain('2 orgs');
      expect(confirmed.config?.message).toContain('My Cloud Foundry');
    });

    it('downloads nothing when the confirmation is declined', async () => {
      confirmed.accept = false;
      await clickDetailExport();
      expect(confirmed.config).not.toBeNull();
      expect(URL.createObjectURL).not.toHaveBeenCalled();
    });

    it('mentions role grants in the confirmation only once they are measured', async () => {
      measure.roles.set(new Map([
        ['cf-1', {
          users: [user('alice', { orgRoles: [{ orgGuid: 'o1', roles: ['org_manager'] }] })],
          fetchedAt: new Date(),
        }],
      ]));
      await clickDetailExport();
      expect(confirmed.config?.message).toContain('user role grants');
      expect(component.detailPayload(component.sections()[0])?.organizations[0].roles).toEqual({
        alice: ['org_manager'],
      });
    });

    it('leaves service data out until the services drain has run', async () => {
      endpoints.set([adminCfEndpoint]);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(component.detailPayload(component.sections()[0])?.organizations[0].spaces?.[0])
        .not.toHaveProperty('service_instances');

      services.get('cf-1').servicesDetailsLastFetched.set(new Date('2026-08-01T10:00:00Z'));
      fixture.detectChanges();
      await fixture.whenStable();
      const payload = component.detailPayload(component.sections()[0]);
      expect(payload?.organizations[0].spaces?.[0].service_instances?.[0].guid).toBe('si1');
      expect(payload?.organizations[0].spaces?.[0].apps?.[0].service_bindings?.[0].guid).toBe('b1');
      expect(payload?.drains['services']).toBe('2026-08-01T10:00:00.000Z');
      // 1 instance loaded against a session count of 3 — a prefix, and it says so.
      expect(payload?.truncated).toEqual(['service_instances']);
    });
  });
});
