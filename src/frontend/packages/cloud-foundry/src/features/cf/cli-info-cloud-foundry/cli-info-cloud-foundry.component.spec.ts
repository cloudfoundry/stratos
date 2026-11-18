import { TemplatePortal } from '@angular/cdk/portal';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { TabNavService, CoreModule } from '@stratosui/core';
import { EntityCatalogTestModule, TEST_CATALOGUE_ENTITIES, generateStratosEntities } from '@stratosui/store';
import { createEmptyStoreModule, STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { CliCommandComponent } from '../../../shared/components/cli-info/cli-command/cli-command.component';
import { CliInfoComponent } from '../../../shared/components/cli-info/cli-info.component';
import { CfUserPermissionDirective } from '../../../shared/directives/cf-user-permission/cf-user-permission.directive';
import { generateCFEntities } from '../../../cf-entity-generator';
import { ActiveRouteCfOrgSpace } from '../cf-page.types';
import { CloudFoundryEndpointService } from '../services/cloud-foundry-endpoint.service';
import { CloudFoundryOrganizationService } from '../services/cloud-foundry-organization.service';
import { CloudFoundrySpaceService } from '../services/cloud-foundry-space.service';
import { CliInfoCloudFoundryComponent } from "./cli-info-cloud-foundry.component";

describe('CliInfoCloudFoundryComponent', () => {
  let component: CliInfoCloudFoundryComponent;
  let fixture: ComponentFixture<CliInfoCloudFoundryComponent>;

  const cfRoute = { cfGuid: 'test-guid' };
  const orgRoute = { cfGuid: 'test-guid', orgGuid: 'org-guid' };
  const spaceRoute = { cfGuid: 'test-guid', orgGuid: 'org-guid', spaceGuid: 'space-guid' };

  const mockEndpointService = {
    endpoint: signal({
      entity: {
        guid: 'test-guid',
        name: 'Test Endpoint',
        api_endpoint: { Scheme: 'https', Host: 'api.example.com', Path: '' },
        user: { name: 'testuser' },
        skip_ssl_validation: true,
        sso_allowed: true,
      }
    })
  };

  // Factories, so a test can tell whether the component asked for the service.
  // The real services request their organization or space when they are built.
  const loadedOrg = { guid: 'org-guid', name: 'my org' };
  const loadedSpace = { guid: 'space-guid', name: 'my space' };
  const org = signal<typeof loadedOrg | null>(loadedOrg);
  const space = signal<typeof loadedSpace | null>(loadedSpace);
  const orgServiceFactory = vi.fn(() => ({ orgDataService: { org } }));
  const spaceServiceFactory = vi.fn(() => ({ spaceDataService: { space } }));

  async function create(route: { cfGuid: string, orgGuid?: string, spaceGuid?: string }): Promise<string> {
    await TestBed.configureTestingModule({
      imports: [
        createEmptyStoreModule(),
        EntityCatalogTestModule,
        CoreModule,
        NoopAnimationsModule,
        CliInfoCloudFoundryComponent,
        CliInfoComponent,
        CliCommandComponent,
        CfUserPermissionDirective,
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
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        TabNavService,
      ]
    })
      .overrideComponent(CliInfoCloudFoundryComponent, {
        set: {
          providers: [
            { provide: ActiveRouteCfOrgSpace, useValue: route },
            { provide: CloudFoundryEndpointService, useValue: mockEndpointService },
            { provide: CloudFoundryOrganizationService, useFactory: orgServiceFactory },
            { provide: CloudFoundrySpaceService, useFactory: spaceServiceFactory }
          ]
        }
      })
      .compileComponents();

    fixture = TestBed.createComponent(CliInfoCloudFoundryComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  // The page header renders through a portal; attach it next to the
  // header so its buttons are in the fixture's DOM.
  async function renderHeader(): Promise<void> {
    const portal = TestBed.inject(TabNavService).pageHeader() as TemplatePortal;
    portal.viewContainerRef.createEmbeddedView(portal.templateRef, portal.context);
    await fixture.whenStable();
  }

  beforeEach(() => {
    orgServiceFactory.mockClear();
    spaceServiceFactory.mockClear();
    org.set(loadedOrg);
    space.set(loadedSpace);
  });

  it('should create', async () => {
    await create(spaceRoute);
    expect(component).toBeTruthy();
  });

  it('does not build the organization or space service on a route with neither', async () => {
    const text = await create(cfRoute);

    expect(orgServiceFactory).not.toHaveBeenCalled();
    expect(spaceServiceFactory).not.toHaveBeenCalled();
    expect(text).toContain('cf target -o "[organization name]" -s "[space name]"');
  });

  // #6126: each level shows its own commands, grouped by the tabs of its page.
  it('shows the Cloud Foundry commands on a Cloud Foundry route', async () => {
    const text = await create(cfRoute);
    const headings = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('h4')).map(h => h.textContent?.trim());

    expect(headings).toContain('Feature Flags');
    expect(text).toContain('cf create-org [name]');
    expect(text).not.toContain('cf space-users');
    expect(text).not.toContain('cf org "');
  });

  it('shows the organization commands with the name quoted on an organization route', async () => {
    const text = await create(orgRoute);

    expect(text).toContain('cf org "my org"');
    expect(text).toContain('cf org-users "my org"');
    expect(text).toContain('cf create-space [name] -o "my org"');
    expect(text).not.toContain('cf space-users');
  });

  it('shows the space commands with the names quoted on a space route', async () => {
    const text = await create(spaceRoute);

    expect(text).toContain('cf space "my space"');
    // space-users takes the organization as well as the space.
    expect(text).toContain('cf space-users "my org" "my space"');
    expect(text).toContain('cf set-space-role [user] "my org" "my space" [role]');
    expect(text).not.toContain('cf org-users');
  });

  it('waits for the organization and space to load before filling in their names', async () => {
    // Opened by its address, the page is built before either has loaded.
    org.set(null);
    space.set(null);
    await create(spaceRoute);
    // No placeholders for the names while they load
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('[organization name]');

    org.set(loadedOrg);
    space.set(loadedSpace);
    await fixture.whenStable();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('cf target -o "my org" -s "my space"');
    expect(text).not.toContain('[organization name]');
  });

  it('passes the endpoint\'s certificate and single sign-on settings to Getting Started', async () => {
    const text = await create(cfRoute);

    expect(text).toContain('cf api https://api.example.com --skip-ssl-validation');
    expect(text).toContain('cf login --sso');
  });

  it('labels the close button "Back"', async () => {
    await create(cfRoute);
    await renderHeader();

    const close = (fixture.nativeElement as HTMLElement).querySelector('.page-header-right button');
    expect(close?.getAttribute('aria-label')).toBe('Back');
  });

  it('goes back to the space when the page was opened by its address', async () => {
    await create(spaceRoute);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    component.back();

    expect(navigate).toHaveBeenCalledWith(
      '/cloud-foundry/test-guid/organizations/org-guid/spaces/space-guid'.split('/'),
      { queryParams: {} },
    );
  });
});
