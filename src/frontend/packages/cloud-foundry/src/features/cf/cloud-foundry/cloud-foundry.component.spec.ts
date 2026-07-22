import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Signal, WritableSignal, computed, importProvidersFrom, provideZonelessChangeDetection, signal } from '@angular/core';
import { Router, provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { EndpointRowActionsService, TabNavService } from '@stratosui/core';
import type { EndpointModel } from '@stratosui/store';
import { EndpointsDataService } from '../../../../../store/src/services/endpoints-data.service';
import { EntityCatalogHelper, EntityCatalogHelpers, EntityCatalogTestModule, generateStratosEntities, TEST_CATALOGUE_ENTITIES } from '@stratosui/store';
import { createBasicStoreModule, STORE_TEST_PROVIDERS, testSCFEndpointGuid, populateStoreWithTestEndpoint } from '@stratosui/store/testing';
import { CF_BASE_TEST_PROVIDERS, generateCfActiveRouteMock } from '@test-framework/cf';

import { generateCFEntities } from '../../../cf-entity-generator';
import { CfEndpointsMissingComponent } from '../../../shared/components/cf-endpoints-missing/cf-endpoints-missing.component';
import { CloudFoundryService } from '../../../shared/data-services/cloud-foundry.service';
import { CloudFoundryComponent } from './cloud-foundry.component';

describe('CloudFoundryComponent', () => {
  let component: CloudFoundryComponent;
  let fixture: ComponentFixture<CloudFoundryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CloudFoundryComponent,
        CfEndpointsMissingComponent,
        NoopAnimationsModule,
        {
          ngModule: EntityCatalogTestModule,
          providers: [
            {
              provide: TEST_CATALOGUE_ENTITIES,
              useValue: [
                ...generateCFEntities(),
                ...generateStratosEntities(),
              ]
            }
          ]
        },
      ],
      providers: [
        provideZonelessChangeDetection(),
        importProvidersFrom(createBasicStoreModule()),
        ...STORE_TEST_PROVIDERS,
        EntityCatalogHelper,
        ...CF_BASE_TEST_PROVIDERS,
        generateCfActiveRouteMock(testSCFEndpointGuid),
        CloudFoundryService,
        TabNavService,
      ]
    }).compileComponents();

    // Initialize EntityCatalogHelper
    const helper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(helper);

    // Populate store with test endpoint data to prevent EmptyError
    populateStoreWithTestEndpoint();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

// The single-CF shortcut is a one-shot decision taken once the endpoint list
// has hydrated. It used to sample connectedCFEndpoints$ with take(1) in the
// constructor, which on a cold load reads the empty pre-fetch list, sees zero
// endpoints and never looks again — so the picker it exists to skip was shown
// to every single-CF user who reloaded or followed a bookmark. See #5638.
describe('CloudFoundryComponent single-CF shortcut', () => {
  const endpoint = (guid: string): EndpointModel =>
    ({ guid, name: guid, cnsi_type: 'cf', connectionStatus: 'connected' }) as EndpointModel;

  let endpoints: WritableSignal<EndpointModel[]>;
  let resolveReady: () => void;
  let ready: Promise<void>;
  let navigate: ReturnType<typeof vi.fn>;

  // Reproduces a cold load: the component is constructed while the endpoint
  // list is still empty and the first /pp/v1/info call is in flight, and the
  // list only fills as hydration completes. `hydrate` runs in that window, so
  // any implementation that reads the list at construction time sees zero.
  const createComponent = async (hydrate: () => void = () => undefined): Promise<void> => {
    TestBed.createComponent(CloudFoundryComponent);
    hydrate();
    resolveReady();
    await ready;
    // Let the whenReady().then() callback run.
    await Promise.resolve();
  };

  beforeEach(async () => {
    endpoints = signal<EndpointModel[]>([]);
    ready = new Promise<void>(resolve => { resolveReady = resolve; });
    navigate = vi.fn().mockResolvedValue(true);

    const availableCFEndpoints: Signal<EndpointModel[]> = computed(() => endpoints());
    const cfService = {
      // The picker + shortcut read the "available" set (connected/expired/
      // connecting); the connected/expired filtering itself is covered in the
      // CloudFoundryService spec. Here it's a passthrough so the shortcut's
      // count logic can be exercised directly.
      availableCFEndpoints,
      // The duplicate-URL banner in the template resolves CloudFoundryService
      // through this same component-level provider. It plays no part in the
      // shortcut, so an empty list keeps it inert.
      connectedCFEndpoints$: of([] as EndpointModel[]),
    };

    await TestBed.configureTestingModule({
      imports: [CloudFoundryComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: EndpointsDataService, useValue: { whenReady: () => ready, isConnecting: () => false } },
        { provide: EndpointRowActionsService, useValue: { buildEndpointActions: () => [] } },
      ],
    })
      // CloudFoundryService is a component-level provider, so it has to be
      // replaced on the component rather than in the testing module.
      .overrideComponent(CloudFoundryComponent, { set: { providers: [{ provide: CloudFoundryService, useValue: cfService }] } })
      .compileComponents();

    vi.spyOn(TestBed.inject(Router), 'navigate').mockImplementation(navigate);
  });

  it('routes into the only connected CF once the endpoint list has hydrated', async () => {
    await createComponent(() => endpoints.set([endpoint('cf-only')]));

    expect(navigate).toHaveBeenCalledWith(['cloud-foundry', 'cf-only']);
  });

  it('routes into a lone expired CF — the user never disconnected it, so it is still theirs', async () => {
    const expired = { guid: 'cf-expired', name: 'cf-expired', cnsi_type: 'cf', connectionStatus: 'expired' } as EndpointModel;
    await createComponent(() => endpoints.set([expired]));

    expect(navigate).toHaveBeenCalledWith(['cloud-foundry', 'cf-expired']);
  });

  it('leaves the picker up when several CFs are connected', async () => {
    await createComponent(() => endpoints.set([endpoint('cf-1'), endpoint('cf-2')]));

    expect(navigate).not.toHaveBeenCalled();
  });

  it('leaves the picker up when no CF is connected', async () => {
    await createComponent();

    expect(navigate).not.toHaveBeenCalled();
  });
});
