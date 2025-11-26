import { importProvidersFrom } from '@angular/core';
import { provideZonelessChangeDetection } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { StoreModule } from '@ngrx/store';
import { describe, it, expect, beforeEach } from 'vitest';

import {
  EntityCatalogTestModule,
  generateStratosEntities,
  TEST_CATALOGUE_ENTITIES,
  appReducers,
  EntityCatalogHelper,
  EntityCatalogHelpers,
  EntityServiceFactory,
  EntityMonitorFactory,
  PaginationMonitorFactory
} from '@stratosui/store';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { CurrentUserPermissionsService } from '@stratosui/core';
import { cfCurrentUserPermissionsService } from '@stratosui/cloud-foundry';
import { CloudFoundryTestingModule, generateCFEntities } from '@test-framework/cf';
import { ServicesWallService } from '../../../../../../features/services/services/services-wall.service';
import { ServiceActionHelperService } from '../../../../../data-services/service-action-helper.service';
import {
  CloudFoundryUserProvidedServicesService,
} from '../../../../../services/cloud-foundry-user-provided-services.service';
import { CfOrgSpaceLinksComponent } from '../../../../cf-org-space-links/cf-org-space-links.component';
import { UserProvidedServiceInstanceCardComponent } from "./user-provided-service-instance-card.component";

describe('UserProvidedServiceInstanceCardComponent', () => {
  let component: UserProvidedServiceInstanceCardComponent;
  let fixture: ComponentFixture<UserProvidedServiceInstanceCardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        UserProvidedServiceInstanceCardComponent,
        CfOrgSpaceLinksComponent,
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideNoopAnimations(),
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(
          CloudFoundryTestingModule,
          StoreModule.forRoot(appReducers, {
            runtimeChecks: { strictStateImmutability: false, strictActionImmutability: false }
          }),
          EntityCatalogTestModule
        ),
        {
          provide: TEST_CATALOGUE_ENTITIES,
          useValue: [
            ...generateStratosEntities(),
            ...generateCFEntities(),
          ]
        },
        EntityServiceFactory,
        EntityMonitorFactory,
        PaginationMonitorFactory,
        EntityCatalogHelper,
        ...cfCurrentUserPermissionsService,
        ServicesWallService,
        ServiceActionHelperService,
        CloudFoundryUserProvidedServicesService,
      ]
    })
      .compileComponents();

    // Initialize EntityCatalogHelper for Angular 20 compatibility
    const helper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(helper);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UserProvidedServiceInstanceCardComponent);
    component = fixture.componentInstance;
    component.row = {
      entity: {
        cfGuid: 'test-cf-guid',
        space_guid: '',
        name: '',
        credentials: {},
        syslog_drain_url: '',
        space_url: '',
        routes: [],
        space: {
          entity: {
            name: '',
            organization_guid: '',
            allow_ssh: false,
            organization_url: '',
            developers_url: '',
            managers_url: '',
            auditors_url: '',
            apps_url: '',
            routes_url: '',
            domains_url: '',
            service_instances_url: '',
            app_events_url: '',
            security_groups_url: '',
            staging_security_groups_url: '',
          },
          metadata: {
            created_at: '',
            guid: '',
            updated_at: '',
            url: ''
          }
        },
        type: '',
        tags: [],
        service_bindings: [],
        service_bindings_url: '',
        routes_url: '',
        route_service_url: ''
      },
      metadata: {
        created_at: '',
        guid: '',
        updated_at: '',
        url: ''
      }
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
