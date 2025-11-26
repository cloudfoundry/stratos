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
import { CloudFoundryTestingModule, generateCFEntities } from '@test-framework/cf';
import {ServiceActionHelperService,
  cfCurrentUserPermissionsService} from '@stratosui/cloud-foundry';
import { ServicesWallService } from '../../../../../../features/services/services/services-wall.service';
import { ServiceInstanceCardComponent } from "./service-instance-card.component";

describe('ServiceInstanceCardComponent', () => {
  let component: ServiceInstanceCardComponent;
  let fixture: ComponentFixture<ServiceInstanceCardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ServiceInstanceCardComponent,
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
      ]
    })
      .compileComponents();

    // Initialize EntityCatalogHelper for Angular 20 compatibility
    const helper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(helper);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ServiceInstanceCardComponent);
    component = fixture.componentInstance;
    component.row = {
      entity: {
        name: 'test-service-instance',
        service_plan_guid: 'test',
        space_guid: 'test-space-guid',
        cfGuid: 'test-cf-guid',
        service_bindings: [],
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
        dashboard_url: '',
        type: '',
        tags: [],
        service_guid: 'service_guid',
        service_plan_url: '',
        service_bindings_url: '',
        service_keys_url: '',
        last_operation: {
          type: '',
          state: '',
          description: '',
          updated_at: '',
          created_at: ''
        },
        service_plan: {
          entity: {
            name: '',
            free: true,
            description: '',
            service_guid: '',
            extra: '',
            unique_id: '',
            public: false,
            bindable: 0,
            active: false,
            service_url: '',
            service: {
              entity: {
                label: '',
                description: '',
                active: 1,
                bindable: 1,
                unique_id: '',
                extra: '',
                tags: [''],
                requires: [''],
                service_broker_guid: 'service_broker_guid',
                plan_updateable: 1,
                service_plans_url: '',
                service_plans: [],
              },
              metadata: {
                guid: '',
                created_at: '',
                updated_at: '',
                url: ''
              }
            },
            service_instances_url: '',
          },
          metadata: {
            created_at: '',
            guid: '',
            updated_at: '',
            url: ''
          }
        },
        routes_url: '',
        service_url: ''
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
