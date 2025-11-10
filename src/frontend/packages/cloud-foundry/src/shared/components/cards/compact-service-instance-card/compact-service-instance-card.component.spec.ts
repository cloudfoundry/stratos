import { provideZonelessChangeDetection, importProvidersFrom } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
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
import { AppChipsComponent } from '@stratosui/core';
import { CloudFoundryTestingModule, generateCFEntities } from '@test-framework/cf';
import { CompactServiceInstanceCardComponent } from './compact-service-instance-card.component';

describe('CompactServiceInstanceCardComponent', () => {
  let component: CompactServiceInstanceCardComponent;
  let fixture: ComponentFixture<CompactServiceInstanceCardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        CompactServiceInstanceCardComponent,
        AppChipsComponent,
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
      ]
    })
      .compileComponents();

    // Initialize EntityCatalogHelper for Angular 20 compatibility
    const helper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(helper);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CompactServiceInstanceCardComponent);
    component = fixture.componentInstance;
    component.serviceInstance = {
      entity: {
        name: 'Ntahtntest',
        credentials: {},
        service_plan_guid: '35f97198-390b-4d88-be93-dc917794b12d',
        space_guid: 'fa4b5a9e-8324-48d9-9de5-491892ec1cb8',
        gateway_data: null,
        dashboard_url: 'https://cf-dev.io/manage/instances/250d8795-d49e-4669-acd5-b5cf94f97c7b',
        type: 'managed_service_instance',
        last_operation: {
          type: 'create',
          state: 'succeeded',
          description: '',
          updated_at: '2018-05-22T14:53:29Z',
          created_at: '2018-05-22T14:53:29Z'
        },
        tags: [
          'sd',
          'asd',
          'asf'
        ],
        service_guid: 'd10101a2-6faf-4468-a9db-1d65eb334fab',
        space_url: '/v2/spaces/fa4b5a9e-8324-48d9-9de5-491892ec1cb8',
        service_plan_url: '/v2/service_plans/35f97198-390b-4d88-be93-dc917794b12d',
        service_bindings_url: '/v2/service_instances/250d8795-d49e-4669-acd5-b5cf94f97c7b/service_bindings',
        service_keys_url: '/v2/service_instances/250d8795-d49e-4669-acd5-b5cf94f97c7b/service_keys',
        routes_url: '/v2/service_instances/250d8795-d49e-4669-acd5-b5cf94f97c7b/routes',
        service_url: '/v2/services/d10101a2-6faf-4468-a9db-1d65eb334fab',
        guid: '250d8795-d49e-4669-acd5-b5cf94f97c7b',
        cfGuid: '7d5e510b-8396-4db0-a91c-6abdc390c9d1'
      },
      metadata: {
        guid: '250d8795-d49e-4669-acd5-b5cf94f97c7b',
        url: '/v2/service_instances/250d8795-d49e-4669-acd5-b5cf94f97c7b',
        created_at: '2018-05-22T14:53:29Z',
        updated_at: '2018-05-22T14:53:29Z'
      }
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
