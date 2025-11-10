import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';
import { Store } from '@ngrx/store';

import {
  ConfirmationDialogService,
  CurrentUserPermissionsService,
  MetaCardComponent,
  MetaCardItemComponent,
  MetaCardKeyComponent,
  MetaCardTitleComponent,
  MetaCardValueComponent,
  MultilineTitleComponent,
  ApplicationStateIconComponent,
  ApplicationStateIconPipe,
  CardStatusComponent
} from '@stratosui/core';
import {
  VerifiedSession,
  EntityServiceFactory,
  EntityMonitorFactory,
  PaginationMonitorFactory,
  UserFavoriteManager
} from '@stratosui/store';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import {
  testSessionData,
  generateCfBaseTestModulesNoShared,
  generateTestCfEndpointServiceProvider,
  generateTestCfUserServiceProvider,
} from "@test-framework/cf";
import { CloudFoundryOrganizationService } from '../../../../../../features/cf/services/cloud-foundry-organization.service';
import { CfOrgSpaceDataService } from '../../../../../data-services/cf-org-space-service.service';
import {
  CloudFoundryUserProvidedServicesService,
} from '../../../../../services/cloud-foundry-user-provided-services.service';
import { CfSpaceCardComponent } from "./cf-space-card.component";
describe('CfSpaceCardComponent', () => {
  let component: CfSpaceCardComponent;
  let fixture: ComponentFixture<CfSpaceCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CfSpaceCardComponent,
        MetaCardComponent,
        MetaCardItemComponent,
        MetaCardKeyComponent,
        MetaCardTitleComponent,
        MetaCardValueComponent,
        MultilineTitleComponent,
        ApplicationStateIconComponent,
        ApplicationStateIconPipe,
        CardStatusComponent,
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(generateCfBaseTestModulesNoShared()),
        PaginationMonitorFactory,
        EntityMonitorFactory,
        generateTestCfUserServiceProvider(),
        CfOrgSpaceDataService,
        CloudFoundryOrganizationService,
        generateTestCfEndpointServiceProvider(),
        EntityServiceFactory,
        ConfirmationDialogService,
        CloudFoundryUserProvidedServicesService,
        UserFavoriteManager,
        CurrentUserPermissionsService,
      ]
    })
      .compileComponents();

    const store = TestBed.inject(Store);
    store.dispatch(new VerifiedSession(testSessionData));
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CfSpaceCardComponent);
    component = fixture.componentInstance;
    component.row = {
      metadata: {
        guid: 'd87ba175-51ec-4cc9-916c-bee26d00e498',
        url: '/v2/spaces/d87ba175-51ec-4cc9-916c-bee26d00e498',
        created_at: '2017-10-10T09:28:48Z',
        updated_at: '2017-10-10T09:28:48Z'
      },
      entity: {
        name: 'dev',
        organization_guid: 'a63027a8-e160-4e71-ad59-6675aa94a886',
        space_quota_definition_guid: null,
        isolation_segment_guid: null,
        allow_ssh: true,
        organization_url: '/v2/organizations/a63027a8-e160-4e71-ad59-6675aa94a886',
        developers_url: '/v2/spaces/d87ba175-51ec-4cc9-916c-bee26d00e498/developers',
        managers_url: '/v2/spaces/d87ba175-51ec-4cc9-916c-bee26d00e498/managers',
        auditors_url: '/v2/spaces/d87ba175-51ec-4cc9-916c-bee26d00e498/auditors',
        apps_url: '/v2/spaces/d87ba175-51ec-4cc9-916c-bee26d00e498/apps',
        routes_url: '/v2/spaces/d87ba175-51ec-4cc9-916c-bee26d00e498/routes',
        domains_url: '/v2/spaces/d87ba175-51ec-4cc9-916c-bee26d00e498/domains',
        service_instances_url: '/v2/spaces/d87ba175-51ec-4cc9-916c-bee26d00e498/service_instances',
        app_events_url: '/v2/spaces/d87ba175-51ec-4cc9-916c-bee26d00e498/app_events',
        events_url: '/v2/spaces/d87ba175-51ec-4cc9-916c-bee26d00e498/events',
        security_groups_url: '/v2/spaces/d87ba175-51ec-4cc9-916c-bee26d00e498/security_groups',
        staging_security_groups_url: '/v2/spaces/d87ba175-51ec-4cc9-916c-bee26d00e498/staging_security_groups'
      }
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
