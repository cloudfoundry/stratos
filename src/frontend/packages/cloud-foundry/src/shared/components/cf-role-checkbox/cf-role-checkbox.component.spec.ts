import { provideHttpClient } from '@angular/common/http';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, importProvidersFrom } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { StoreModule } from '@ngrx/store';

import { EntityMonitorFactory, PaginationMonitorFactory, EntityServiceFactory, appReducers, TEST_CATALOGUE_ENTITIES, generateStratosEntities, EntityCatalogTestModule, EntityCatalogHelper, EntityCatalogHelpers } from '@stratosui/store';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { AppTestModule } from '@test-framework';
import { CloudFoundryTestingModule } from "@test-framework/cloud-foundry-endpoint-service.helper";
import { generateCFEntities } from '@test-framework/cf';
import { CfUserServiceTestProvider } from "@test-framework/user-service-helper";
import { ActiveRouteCfOrgSpace } from '../../../features/cf/cf-page.types';
import { CfRolesService } from '../../../features/cf/users/manage-users/cf-roles.service';
import { CfRoleCheckboxComponent } from './cf-role-checkbox.component';

describe('CfRoleCheckboxComponent', () => {
  let component: CfRoleCheckboxComponent;
  let fixture: ComponentFixture<CfRoleCheckboxComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        CfRoleCheckboxComponent,
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
          EntityCatalogTestModule,
          AppTestModule
        ),
        {
          provide: TEST_CATALOGUE_ENTITIES,
          useValue: [
            ...generateStratosEntities(),
            ...generateCFEntities()
          ]
        },
        EntityServiceFactory,
        EntityMonitorFactory,
        PaginationMonitorFactory,
        EntityCatalogHelper,
        CfUserServiceTestProvider,
        CfRolesService,
        {
          provide: ActiveRouteCfOrgSpace,
          useValue: {
            cfGuid: 'cfGuid',
            orgGuid: 'orgGuid',
            spaceGuid: 'spaceGuid'
          }
        },
      ],
    })
      .compileComponents();

    // Initialize EntityCatalogHelper for Angular 20 compatibility
    const helper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(helper);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CfRoleCheckboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
