import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Signal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { CnsiUsersSnapshotService } from '../../../services/endpoint-data/cnsi-users-snapshot.service';
import { OrgDataRegistry } from '../../../services/endpoint-data/org-data.registry';
import { QuotaDataService } from '../../../services/endpoint-data/quota-data.service';
import { ServiceCatalogDataService } from '../../../services/endpoint-data/service-catalog-data.service';
import { StOrgDetail, StOrgQuota } from '../../../services/endpoint-data/stratos-types';
import {
  CloudFoundryUserProvidedServicesService,
} from '../../../shared/services/cloud-foundry-user-provided-services.service';
import { ActiveRouteCfOrgSpace } from '../cf-page.types';
import { CloudFoundryEndpointService } from './cloud-foundry-endpoint.service';
import { CloudFoundryOrganizationService } from './cloud-foundry-organization.service';

describe('CloudFoundryOrganizationService — quotaDefinition$', () => {
  let org: ReturnType<typeof signal<StOrgDetail | null>>;
  let quota: ReturnType<typeof signal<StOrgQuota | null>>;
  // Each live signal-to-observable bridge reads the quota value once per
  // write, so the read count after one write is the number of live bridges.
  let quotaReads: number;
  // quota lookups made, one per quota the stream switched to
  let lookups: number;

  beforeEach(() => {
    org = signal<StOrgDetail | null>(null);
    quota = signal<StOrgQuota | null>(null);
    quotaReads = 0;
    lookups = 0;
    const countedQuota = (() => {
      quotaReads++;
      return quota();
    }) as Signal<StOrgQuota | null>;

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActiveRouteCfOrgSpace, useValue: { cfGuid: 'cf-1', orgGuid: 'org-1' } },
        {
          provide: OrgDataRegistry,
          useValue: { acquire: () => ({ load: () => of(undefined), org, spaces: signal([]) }) },
        },
        { provide: QuotaDataService, useValue: { orgQuota: () => { lookups++; return { value: countedQuota }; } } },
        { provide: CnsiUsersSnapshotService, useValue: { users: () => signal(null) } },
        { provide: ServiceCatalogDataService, useValue: { serviceInstanceCount: () => ({ value: signal(0) }) } },
        {
          provide: CloudFoundryUserProvidedServicesService,
          useValue: { fetchUserProvidedServiceInstancesCount: () => of(0) },
        },
        {
          provide: CloudFoundryEndpointService,
          useValue: {
            currentUser$: of({ guid: 'me' }),
            apps$: of([]),
            hasApps$: of(false),
            appsLoading$: of(false),
            fetchAppCount: () => of(0),
            fetchRouteCount: () => of(0),
          },
        },
        CloudFoundryOrganizationService,
      ],
    });
  });

  afterEach(() => TestBed.resetTestingModule());

  it('keeps one quota bridge alive however often the org re-emits', () => {
    const svc = TestBed.inject(CloudFoundryOrganizationService);
    const seen: StOrgQuota[] = [];
    const sub = svc.quotaDefinition$.subscribe(q => seen.push(q));

    // Each change of quota re-runs the switchMap, which builds a new
    // bridge to the quota signal.
    for (const quotaGuid of ['quota-a', 'quota-b', 'quota-1']) {
      org.set({ guid: 'org-1', name: 'a', quotaGuid } as StOrgDetail);
      TestBed.tick();
    }

    quotaReads = 0;
    const q = { guid: 'quota-1', name: 'default' } as StOrgQuota;
    quota.set(q);
    TestBed.tick();

    expect(quotaReads).toBe(1);
    expect(seen).toEqual([q]);
    sub.unsubscribe();
  });

  it('looks the quota up again only when the quota changes', () => {
    const svc = TestBed.inject(CloudFoundryOrganizationService);
    const sub = svc.quotaDefinition$.subscribe();

    // A rename patches the org but keeps its quota
    for (const name of ['a', 'b', 'c']) {
      org.set({ guid: 'org-1', name, quotaGuid: 'quota-1' } as StOrgDetail);
      TestBed.tick();
    }

    expect(lookups).toBe(1);
    sub.unsubscribe();
  });
});
