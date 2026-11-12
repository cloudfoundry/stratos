import { TemplatePortal } from '@angular/cdk/portal';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom, provideZonelessChangeDetection, signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import {
  CurrentUserPermissionsService,
  TabNavService
} from '@stratosui/core';
import { CfCurrentUserPermissions, cfCurrentUserPermissionsService } from '@stratosui/cloud-foundry';
import { TEST_CATALOGUE_ENTITIES, generateStratosEntities, EntityCatalogTestModule, EntityCatalogHelper, EntityCatalogHelpers } from '@stratosui/store';
import { STORE_TEST_PROVIDERS, testSCFEndpointGuid, populateStoreWithTestEndpoint } from '@stratosui/store/testing';
import { generateCFEntities, generateTestCfEndpointServiceProvider } from '@test-framework/cf';
import { ActiveRouteCfOrgSpace } from '../cf-page.types';
import { CfUsersPagedDataService } from '../../../shared/data-services/cf-users-paged-data.service';
import { CloudFoundryTabsBaseComponent } from "./cloud-foundry-tabs-base.component";
describe('CloudFoundryTabsBaseComponent', () => {
  let component: CloudFoundryTabsBaseComponent;
  let fixture: ComponentFixture<CloudFoundryTabsBaseComponent>;
  const users = signal<unknown[] | null>(null);
  const canViewFirehose = signal(false);
  beforeEach(async () => {
      users.set(null);
      canViewFirehose.set(false);
      await TestBed.configureTestingModule({
        imports: [CloudFoundryTabsBaseComponent],
        providers: [
          provideZonelessChangeDetection(),
          provideRouter([]),
          provideHttpClient(),
          provideHttpClientTesting(),
          provideNoopAnimations(),
          ...STORE_TEST_PROVIDERS,
          importProvidersFrom(
            EntityCatalogTestModule
          ),
          {
            provide: TEST_CATALOGUE_ENTITIES,
            useValue: [
              ...generateStratosEntities(),
              ...generateCFEntities()
            ]
          },
          ...cfCurrentUserPermissionsService,
          ...generateTestCfEndpointServiceProvider(),
          { provide: ActiveRouteCfOrgSpace, useValue: { cfGuid: testSCFEndpointGuid } },
          { provide: CfUsersPagedDataService, useValue: { users: () => users } },
          TabNavService,
        ]
      }).compileComponents();

      // Initialize EntityCatalogHelper
      const entityCatalogHelper = TestBed.inject(EntityCatalogHelper);
      EntityCatalogHelpers.SetEntityCatalogHelper(entityCatalogHelper);

      populateStoreWithTestEndpoint();
    });

  beforeEach(async () => {
    const perms = TestBed.inject(CurrentUserPermissionsService);
    const realCan = perms.can.bind(perms);
    vi.spyOn(perms, 'can').mockImplementation((perm, ...args) =>
      perm === CfCurrentUserPermissions.FIREHOSE_VIEW ? canViewFirehose : realCan(perm, ...args));
    fixture = TestBed.createComponent(CloudFoundryTabsBaseComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // #6126: every tab offers the CF CLI menu in the sub-nav row.
  it('puts the CF CLI menu in the sub-nav row', async () => {
    await fixture.whenStable();
    const portal = TestBed.inject(TabNavService).tabSubNav() as TemplatePortal;
    expect(portal).toBeTruthy();
    const view = portal.viewContainerRef.createEmbeddedView(portal.templateRef);
    view.detectChanges();
    const row = view.rootNodes.find((n: Node) => n instanceof HTMLElement) as HTMLElement;
    expect(row.querySelector('button[aria-label="CF CLI"]')).toBeTruthy();
  });

  it('hides the Users tab until the endpoint has users', async () => {
    const usersTab = component.tabLinks.find(t => t.link === CloudFoundryTabsBaseComponent.users);
    const hidden = usersTab!.isHidden!;
    expect(hidden()).toBe(true);

    users.set([]);
    expect(hidden()).toBe(true);

    users.set([{}, {}]);
    expect(hidden()).toBe(false);
  });

  it('hides the Firehose tab until the user may view the firehose', () => {
    const firehoseTab = component.tabLinks.find(t => t.link === CloudFoundryTabsBaseComponent.firehose);
    const hidden = firehoseTab!.isHidden!;
    expect(hidden()).toBe(true);

    canViewFirehose.set(true);
    expect(hidden()).toBe(false);
  });

  afterAll(() => { });
});
