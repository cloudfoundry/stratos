import { provideHttpClient } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, importProvidersFrom, NO_ERRORS_SCHEMA } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { TEST_CATALOGUE_ENTITIES, generateStratosEntities, EntityCatalogTestModule, EntityCatalogHelper, EntityCatalogHelpers } from '@stratosui/store';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { AppTestModule } from '@test-framework';
import { CloudFoundryTestingModule, generateCFEntities } from '@test-framework/cf';
import { CfUserServiceTestProvider } from "@test-framework/user-service-helper";
import { TabNavService } from '@stratosui/core';

import { ActiveRouteCfOrgSpace } from '../../cf-page.types';
import { CfRolesService } from './cf-roles.service';
import { UsersRolesComponent } from './manage-users.component';

describe('UsersRolesComponent', () => {
  let component: UsersRolesComponent;
  let fixture: ComponentFixture<UsersRolesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        UsersRolesComponent,
      ],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideNoopAnimations(),
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(
          HttpClientTestingModule,
          CloudFoundryTestingModule,
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
        EntityCatalogHelper,
        CfUserServiceTestProvider,
        CfRolesService,
        TabNavService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParams: { breadcrumbs: 'key' },
              params: {}
            }
          }
        },
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
    fixture = TestBed.createComponent(UsersRolesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('F: breadcrumbs$ emits a single Users breadcrumb pointing at defaultCancelUrl', async () => {
    // breadcrumbs$ must emit [{ breadcrumbs: [{ value: 'Users', routerLink: defaultCancelUrl }] }].
    // The harness uses a real route (cfGuid resolves to null from the ActivatedRoute snapshot),
    // so we validate structure and coherence rather than a hardcoded URL string.
    const breadcrumbs = await firstValueFrom(component.breadcrumbs$);
    expect(breadcrumbs.length).toBe(1);
    const crumbs = breadcrumbs[0].breadcrumbs;
    expect(crumbs.length).toBe(1);
    expect(crumbs[0].value).toBe('Users');
    // The routerLink must match the component's computed defaultCancelUrl.
    expect(crumbs[0].routerLink).toBe(component.defaultCancelUrl);
    // defaultCancelUrl is always a /cloud-foundry path ending in /users.
    expect(component.defaultCancelUrl).toMatch(/^\/cloud-foundry\/.+\/users$/);
  });
});
