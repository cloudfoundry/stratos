import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, Subject } from 'rxjs';

import { CF_FAILURE_DETAIL, cfRequestFailure, snackText } from '@test-framework/cf';

import {
  TabNavService,
  CoreModule,
  ConfirmationDialogService,
  TailwindSnackBarService
} from '@stratosui/core';
import { cfCurrentUserPermissionsService } from '@stratosui/cloud-foundry';
import { EntityCatalogTestModule, TEST_CATALOGUE_ENTITIES, generateStratosEntities, EntityCatalogHelper, EntityCatalogHelpers } from '@stratosui/store';
import { createEmptyStoreModule, STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateCFEntities } from '../../../../../cf-entity-generator';
import { ActiveRouteCfOrgSpace } from '../../../cf-page.types';
import { CloudFoundryOrganizationService } from '../../../services/cloud-foundry-organization.service';
import { CloudFoundryEndpointService } from '../../../services/cloud-foundry-endpoint.service';
import { CfOrgsSignalConfigService } from '../../../../../shared/signal-list-configs/org/cf-orgs-signal-config.service';
import { CloudFoundryOrganizationSummaryComponent } from './cloud-foundry-organization-summary.component';

describe('CloudFoundryOrganizationSummaryComponent', () => {
  let component: CloudFoundryOrganizationSummaryComponent;
  let fixture: ComponentFixture<CloudFoundryOrganizationSummaryComponent>;

  const mockOrgService = {
    cfGuid: 'cf-guid',
    orgGuid: 'org-guid',
    orgDataService: {
      org: () => null,
      spaces: () => [],
      isLoading: () => false,
      errors: () => [],
      load: () => of(undefined),
    },
    serviceInstancesCount: (() => 0) as unknown as import('@angular/core').Signal<number>,
    userProvidedServiceInstancesCount$: new Subject<number>(),
    routesCount$: of(3),
    privateDomains$: of([]),
    quotaDefinition: signal(null),
    loadingApps: signal(true),
    spaces: signal(null),
    apps: signal<unknown[] | null>(null),
    appInstances: signal(null),
    totalMem: signal(null),
    usersCount: signal(null),
    userOrgRole: signal(null),
    quotaLink: signal(undefined),
    fetchApps: () => {},
  };

  const mockEndpointService = {
    cfGuid: 'cf-guid',
    hasApps: signal(false),
    fetchAppCount: () => of(7),
    deleteOrg: () => {}
  };

  const mockOrgsConfig = {
    deleteOrg: async (_cnsiGuid: string, _orgGuid: string) => {}
  };

  // An organization page's route names no space.
  const mockActiveRoute = {
    cfGuid: 'cf-guid',
    orgGuid: 'org-guid',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        createEmptyStoreModule(),
        EntityCatalogTestModule,
        CoreModule,
        NoopAnimationsModule,
        CloudFoundryOrganizationSummaryComponent,
      ],
      providers: [
        ...STORE_TEST_PROVIDERS,
        {
          provide: TEST_CATALOGUE_ENTITIES,
          useValue: [
            ...generateStratosEntities(),
            ...generateCFEntities()
          ]
        },
        EntityCatalogHelper,
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActiveRouteCfOrgSpace, useValue: mockActiveRoute },
        { provide: CloudFoundryOrganizationService, useValue: mockOrgService },
        { provide: CloudFoundryEndpointService, useValue: mockEndpointService },
        { provide: CfOrgsSignalConfigService, useValue: mockOrgsConfig },
        TabNavService,
        ConfirmationDialogService,
        TailwindSnackBarService,
        ...cfCurrentUserPermissionsService,
      ]
    })
      .compileComponents();

    // Set EntityCatalogHelper after TestBed is configured
    const helper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(helper);
  });

  beforeEach(async () => {
    mockOrgService.userProvidedServiceInstancesCount$ = new Subject<number>();
    mockOrgService.loadingApps.set(true);
    mockOrgService.apps.set(null);
    mockEndpointService.hasApps.set(false);
    fixture = TestBed.createComponent(CloudFoundryOrganizationSummaryComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // The tiles wait for the apps and the user-provided service count; a later
  // poll (apps loading again) does not bring the loading page back.
  it('shows the loading page until the apps and the user-provided count are in, then never again', () => {
    expect(component.detailsLoading()).toBe(true);
    mockOrgService.loadingApps.set(false);
    expect(component.detailsLoading()).toBe(true);
    mockOrgService.userProvidedServiceInstancesCount$.next(0);
    expect(component.detailsLoading()).toBe(false);
    mockOrgService.loadingApps.set(true);
    expect(component.detailsLoading()).toBe(false);
  });

  it('counts the org\'s apps from the app list once there is one, and asks Cloud Foundry before that', () => {
    expect(component.appCount()).toBe(7);
    mockEndpointService.hasApps.set(true);
    // The list is in but the org's spaces are not: keep the fetched count
    expect(component.appCount()).toBe(7);
    mockOrgService.apps.set([{}, {}]);
    expect(component.appCount()).toBe(2);
  });

  it('says why a delete failed in Cloud Foundry\'s words', async () => {
    const snackError = vi.spyOn(TestBed.inject(TailwindSnackBarService), 'error').mockImplementation(() => undefined as never);
    const confirmOpen = vi.spyOn(TestBed.inject(ConfirmationDialogService), 'open').mockImplementation(() => undefined as never);
    vi.spyOn(mockOrgService.orgDataService, 'org').mockReturnValue({ name: 'acme' } as never);
    vi.spyOn(mockOrgsConfig, 'deleteOrg').mockRejectedValueOnce(cfRequestFailure());

    component.deleteOrgWarn();
    await (confirmOpen.mock.calls[0][1] as () => Promise<void>)();

    expect(snackText(snackError.mock.calls[0][0])).toBe(`Failed to delete organization: ${CF_FAILURE_DETAIL}`);
  });
});
