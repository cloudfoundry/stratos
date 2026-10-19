import { Signal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { CnsiUsersSnapshotService } from '../../../services/endpoint-data/cnsi-users-snapshot.service';
import { QuotaDataService } from '../../../services/endpoint-data/quota-data.service';
import { ServiceCatalogDataService } from '../../../services/endpoint-data/service-catalog-data.service';
import { SpaceDataRegistry } from '../../../services/endpoint-data/space-data.registry';
import { StSpace, StSpaceQuota } from '../../../services/endpoint-data/stratos-types';
import {
  CloudFoundryUserProvidedServicesService,
} from '../../../shared/services/cloud-foundry-user-provided-services.service';
import { ActiveRouteCfOrgSpace } from '../cf-page.types';
import { CloudFoundryEndpointService } from './cloud-foundry-endpoint.service';
import { CloudFoundryOrganizationService } from './cloud-foundry-organization.service';
import { CloudFoundrySpaceService } from './cloud-foundry-space.service';

describe('CloudFoundrySpaceService — spaceQuotaDefinition$', () => {
  let space: ReturnType<typeof signal<StSpace | null>>;
  let quota: ReturnType<typeof signal<StSpaceQuota | null>>;
  // Each live signal-to-observable bridge reads the quota value once per
  // write, so the read count after one write is the number of live bridges.
  let quotaReads: number;

  beforeEach(() => {
    space = signal<StSpace | null>(null);
    quota = signal<StSpaceQuota | null>(null);
    quotaReads = 0;
    const countedQuota = (() => {
      quotaReads++;
      return quota();
    }) as Signal<StSpaceQuota | null>;

    TestBed.configureTestingModule({
      providers: [
        { provide: ActiveRouteCfOrgSpace, useValue: { cfGuid: 'cf-1', orgGuid: 'org-1', spaceGuid: 'space-1' } },
        {
          provide: SpaceDataRegistry,
          useValue: { acquire: () => ({ load: () => of(undefined), space }) },
        },
        { provide: QuotaDataService, useValue: { spaceQuota: () => ({ value: countedQuota }) } },
        { provide: CloudFoundryOrganizationService, useValue: { quotaDefinition$: of(null) } },
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
          },
        },
        CloudFoundrySpaceService,
      ],
    });
  });

  afterEach(() => TestBed.resetTestingModule());

  it('keeps one quota bridge alive however often the space re-emits', () => {
    const svc = TestBed.inject(CloudFoundrySpaceService);
    const seen: (StSpaceQuota | null)[] = [];
    const sub = svc.spaceQuotaDefinition$.subscribe(q => seen.push(q));

    // Each space write (load, then patch() after an edit) re-runs the
    // switchMap, which builds a new bridge to the quota signal.
    for (const name of ['a', 'b', 'c']) {
      space.set({ guid: 'space-1', name, quotaGuid: 'quota-1' } as StSpace);
      TestBed.tick();
    }

    quotaReads = 0;
    const q = { guid: 'quota-1', name: 'small' } as StSpaceQuota;
    quota.set(q);
    TestBed.tick();

    expect(quotaReads).toBe(1);
    expect(seen.at(-1)).toEqual(q);
    sub.unsubscribe();
  });
});
