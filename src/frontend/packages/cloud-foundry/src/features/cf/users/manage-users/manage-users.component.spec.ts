import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom, NO_ERRORS_SCHEMA } from '@angular/core';
import { describe, it, expect, afterEach } from 'vitest';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';

import { TEST_CATALOGUE_ENTITIES, generateStratosEntities, EntityCatalogTestModule, EntityCatalogHelper, EntityCatalogHelpers } from '@stratosui/store';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { AppTestModule, configureZonelessTestBed } from '@test-framework';
import { CloudFoundryTestingModule, generateCFEntities } from '@test-framework/cf';
import { TabNavService } from '@stratosui/core';

import { CfUsersRolesDataService } from '../../../../services/domain-data/cf-users-roles-data.service';
import { StUser } from '../../../../services/endpoint-data/stratos-types';
import { CfRolesService } from './cf-roles.service';
import { UsersRolesComponent } from './manage-users.component';

const CF = 'cf1';
const userUrl = (guid: string) => `/pp/v1/cf/users/${CF}/${guid}`;
const stUser = (guid: string, username: string) => ({ guid, username, orgRoles: [], spaceRoles: [] }) as unknown as StUser;

describe('UsersRolesComponent', () => {
  let component: UsersRolesComponent;
  let fixture: ComponentFixture<UsersRolesComponent>;
  let http: HttpTestingController;

  async function setup(queryParams: Record<string, string> = { breadcrumbs: 'key' }) {
    await configureZonelessTestBed({
      imports: [
        UsersRolesComponent,
      ],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(
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
        CfRolesService,
        TabNavService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParams,
              params: { endpointId: CF }
            }
          }
        },
      ],
    }).compileComponents();

    // Initialize EntityCatalogHelper for Angular 20 compatibility
    const helper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(helper);
    http = TestBed.inject(HttpTestingController);

    fixture = TestBed.createComponent(UsersRolesComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  }

  const text = () => (fixture.nativeElement as HTMLElement).textContent ?? '';
  const q = (sel: string) => (fixture.nativeElement as HTMLElement).querySelector(sel);

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should create', async () => {
    await setup();
    expect(component).toBeTruthy();
  });

  it('F: breadcrumbs emit a single Users breadcrumb pointing at defaultCancelUrl', async () => {
    await setup();
    const breadcrumbs = component.breadcrumbs();
    expect(breadcrumbs.length).toBe(1);
    const crumbs = breadcrumbs[0].breadcrumbs;
    expect(crumbs.length).toBe(1);
    expect(crumbs[0].value).toBe('Users');
    // The routerLink must match the component's computed defaultCancelUrl.
    expect(crumbs[0].routerLink).toBe(component.defaultCancelUrl);
    expect(component.defaultCancelUrl).toBe(`/cloud-foundry/${CF}/users`);
  });

  describe('?users= deep link', () => {
    it('loads the good users and names the guid that failed', async () => {
      await setup({ users: 'good1,bad1,good2' });

      http.expectOne(userUrl('good1')).flush(stUser('good1', 'alice'));
      http.expectOne(userUrl('bad1')).flush({ errors: [{ detail: 'User not found' }] }, { status: 404, statusText: 'Not Found' });
      http.expectOne(userUrl('good2')).flush(stUser('good2', 'bob'));
      await fixture.whenStable();

      const rolesData = TestBed.inject(CfUsersRolesDataService);
      expect(rolesData.users().map(u => u.guid)).toEqual(['good1', 'good2']);
      const err = q('[data-testid="manage-users-lookup-error"]');
      expect(err).toBeTruthy();
      expect(err!.textContent).toContain('bad1');
      expect(err!.textContent).toContain('User not found');
      expect(q('app-steppers')).toBeTruthy();
      expect(q('[data-testid="manage-users-no-users"]')).toBeNull();
    });

    it('shows a message and a way back when no user resolves', async () => {
      await setup({ users: 'bad1,bad2' });

      http.expectOne(userUrl('bad1')).flush({}, { status: 404, statusText: 'Not Found' });
      http.expectOne(userUrl('bad2')).flush({}, { status: 500, statusText: 'Server Error' });
      await fixture.whenStable();

      const none = q('[data-testid="manage-users-no-users"]');
      expect(none).toBeTruthy();
      expect(text()).toContain('bad1');
      expect(text()).toContain('bad2');
      const back = none!.querySelector('a');
      expect(back?.getAttribute('href')).toBe(`/cloud-foundry/${CF}/users`);
      expect(q('app-steppers')).toBeNull();
    });

    it('shows the same message for an empty list (?users=,), with no request', async () => {
      await setup({ users: ',' });
      await fixture.whenStable();

      http.expectNone(r => r.url.startsWith(`/pp/v1/cf/users/${CF}/`));
      expect(q('[data-testid="manage-users-no-users"]')).toBeTruthy();
      expect(q('app-steppers')).toBeNull();
    });

    it('shows the same message for an empty param (?users=)', async () => {
      await setup({ users: '' });
      await fixture.whenStable();

      http.expectNone(r => r.url.startsWith(`/pp/v1/cf/users/${CF}/`));
      expect(q('[data-testid="manage-users-no-users"]')).toBeTruthy();
    });

    it('fetches each user exactly once', async () => {
      await setup({ users: 'g1,g2' });
      await fixture.whenStable();

      const g1 = http.match(userUrl('g1'));
      const g2 = http.match(userUrl('g2'));
      expect(g1.length).toBe(1);
      expect(g2.length).toBe(1);
      g1.forEach(r => r.flush(stUser('g1', 'alice')));
      g2.forEach(r => r.flush(stUser('g2', 'bob')));
      await fixture.whenStable();

      expect(http.match(r => r.url.startsWith(`/pp/v1/cf/users/${CF}/`)).length).toBe(0);
      expect(TestBed.inject(CfUsersRolesDataService).users().map(u => u.guid)).toEqual(['g1', 'g2']);
      // The header renders through a portal outside the fixture, so read
      // the signal it binds.
      expect(component.title()).toBe('Manage User Roles');
    });
  });

  describe('?user= deep link', () => {
    it('fetches the user once and titles the page with the username', async () => {
      await setup({ user: 'g1' });
      await fixture.whenStable();

      const reqs = http.match(userUrl('g1'));
      expect(reqs.length).toBe(1);
      reqs.forEach(r => r.flush(stUser('g1', 'alice')));
      await fixture.whenStable();

      expect(component.title()).toBe('Manage Roles: alice');
    });

    it('shows the message when the single user fails', async () => {
      await setup({ user: 'bad1' });
      await fixture.whenStable();

      http.match(userUrl('bad1')).forEach(r => r.flush({}, { status: 404, statusText: 'Not Found' }));
      await fixture.whenStable();

      expect(q('[data-testid="manage-users-no-users"]')).toBeTruthy();
      expect(text()).toContain('bad1');
    });
  });
});
