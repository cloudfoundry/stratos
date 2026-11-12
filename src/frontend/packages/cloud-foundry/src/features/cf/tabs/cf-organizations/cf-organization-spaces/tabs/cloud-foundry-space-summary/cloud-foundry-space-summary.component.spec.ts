import { CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, Subject } from 'rxjs';

import { EntityCatalogTestModule, TEST_CATALOGUE_ENTITIES, generateStratosEntities, EntityCatalogHelper, EntityCatalogHelpers } from '@stratosui/store';
import { createEmptyStoreModule, STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import {
  TabNavService,
  ConfirmationDialogService,
  TailwindSnackBarService,
  
  CoreModule
} from '@stratosui/core';
import { cfCurrentUserPermissionsService } from '@stratosui/cloud-foundry';
import {
  CF_FAILURE_DETAIL,
  cfRequestFailure,
  CloudFoundrySpaceServiceMock,
  generateActiveRouteCfOrgSpaceMock,
  generateCfActiveRouteMock,
  snackText,
} from '@test-framework/cf';
import { CfSpacesSignalConfigService } from '../../../../../../../shared/signal-list-configs/space/cf-spaces-signal-config.service';
import { CloudFoundryEndpointService } from '../../../../../services/cloud-foundry-endpoint.service';
import { CloudFoundryOrganizationService } from '../../../../../services/cloud-foundry-organization.service';
import { CloudFoundrySpaceService } from '../../../../../services/cloud-foundry-space.service';
import { CfOrgSpaceDataService } from '../../../../../../../shared/data-services/cf-org-space-service.service';
import { UserInviteService, UserInviteConfigureService } from '../../../../../user-invites/user-invite.service';
import { CloudFoundrySpaceSummaryComponent } from './cloud-foundry-space-summary.component';
import { generateCFEntities } from '../../../../../../../cf-entity-generator';

describe('CloudFoundrySpaceSummaryComponent', () => {
  let component: CloudFoundrySpaceSummaryComponent;
  let fixture: ComponentFixture<CloudFoundrySpaceSummaryComponent>;
  let spaceService: CloudFoundrySpaceServiceMock;

  const mockEndpointService = {
    cfGuid: 'cf-1',
    hasApps: signal(false),
    fetchAppCount: () => of(7),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        createEmptyStoreModule(),
        EntityCatalogTestModule,
        CoreModule,
        NoopAnimationsModule,
        CloudFoundrySpaceSummaryComponent,
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
        generateActiveRouteCfOrgSpaceMock(),
        generateCfActiveRouteMock(),
        { provide: CloudFoundrySpaceService, useClass: CloudFoundrySpaceServiceMock },
        { provide: CloudFoundryEndpointService, useValue: mockEndpointService },
        { provide: CloudFoundryOrganizationService, useValue: { cfGuid: 'cf-1', orgGuid: 'org-1' } },
        CfOrgSpaceDataService,
        UserInviteService,
        UserInviteConfigureService,
        TabNavService,
        ConfirmationDialogService,
        TailwindSnackBarService,
        ...cfCurrentUserPermissionsService,
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    })
      .compileComponents();

    // Set EntityCatalogHelper after TestBed is configured
    const helper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(helper);
  });

  beforeEach(() => {
    spaceService = TestBed.inject(CloudFoundrySpaceService) as unknown as CloudFoundrySpaceServiceMock;
    spaceService.userProvidedServiceInstancesCount$ = new Subject<number>();
    spaceService.loadingApps.set(true);
    mockEndpointService.hasApps.set(false);
    fixture = TestBed.createComponent(CloudFoundrySpaceSummaryComponent);
    component = fixture.componentInstance;
    // Don't call detectChanges() to avoid rendering child components
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // The tiles wait for the apps and the user-provided service count; a later
  // poll (apps loading again) does not bring the loading page back.
  it('shows the loading page until the apps and the user-provided count are in, then never again', () => {
    const upsiCount = spaceService.userProvidedServiceInstancesCount$ as Subject<number>;
    expect(component.detailsLoading()).toBe(true);
    spaceService.loadingApps.set(false);
    expect(component.detailsLoading()).toBe(true);
    upsiCount.next(0);
    expect(component.detailsLoading()).toBe(false);
    spaceService.loadingApps.set(true);
    expect(component.detailsLoading()).toBe(false);
  });

  it('counts the space\'s apps from the app list once there is one, and asks Cloud Foundry before that', () => {
    expect(component.appCount()).toBe(7);
    spaceService.apps.set([{}, {}] as never);
    mockEndpointService.hasApps.set(true);
    expect(component.appCount()).toBe(2);
  });

  it('says why a delete failed in Cloud Foundry\'s words', async () => {
    const snackError = vi.spyOn(TestBed.inject(TailwindSnackBarService), 'error').mockImplementation(() => undefined as never);
    vi.spyOn(TestBed.inject(CfSpacesSignalConfigService), 'deleteSpace').mockRejectedValueOnce(cfRequestFailure());

    await component.deleteSpace();

    expect(snackText(snackError.mock.calls[0][0])).toBe(`Failed to delete space: ${CF_FAILURE_DETAIL}`);
  });
});
