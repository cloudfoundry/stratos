import { TemplatePortal } from '@angular/cdk/portal';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { TabNavService } from '@stratosui/core';
import { EndpointModel, EndpointsDataService } from '@stratosui/store';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { AppDetailDataService } from '../app-detail-data.service';
import { ApplicationService } from '../application.service';
import { CliInfoApplicationComponent } from './cli-info-application.component';

describe('CliInfoApplicationComponent', () => {
  let component: CliInfoApplicationComponent;
  let fixture: ComponentFixture<CliInfoApplicationComponent>;

  const endpoint = {
    guid: 'cf-guid',
    name: 'Test Endpoint',
    api_endpoint: { Scheme: 'https', Host: 'api.example.com', Path: '' },
    user: { name: 'testuser' },
    skip_ssl_validation: true,
    sso_allowed: true,
  };

  // The page header renders through a portal; attach it next to the
  // header so its buttons are in the fixture's DOM.
  async function renderHeader(): Promise<void> {
    const portal = TestBed.inject(TabNavService).pageHeader() as TemplatePortal;
    portal.viewContainerRef.createEmbeddedView(portal.templateRef, portal.context);
    await fixture.whenStable();
  }
  const text = (): string => (fixture.nativeElement as HTMLElement).textContent ?? '';

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CliInfoApplicationComponent,
      ],
      providers: [
        ...STORE_TEST_PROVIDERS,
        {
          provide: ApplicationService,
          useValue: {
            cfGuid: 'cf-guid',
            appGuid: 'app-guid',
          }
        },
        {
          provide: AppDetailDataService,
          useValue: {
            app: signal({ entity: { name: 'my app' } }),
            space: signal({ name: 'my space' }),
            org: signal({ name: 'my org' }),
          }
        },
        TabNavService,
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideZonelessChangeDetection(),
      ]
    }).compileComponents();

    // The real service stays, since the page header reads its endpoint list;
    // the page reads the endpoint from its signal.
    Object.defineProperty(TestBed.inject(EndpointsDataService), 'endpoints', {
      value: signal(new Map([['cf-guid', endpoint as EndpointModel]])),
    });

    fixture = TestBed.createComponent(CliInfoApplicationComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('fills the application name into its commands', () => {
    expect(text()).toContain('cf restart "my app"');
  });

  // #6126: the commands are grouped by the application's tabs, from the shared list.
  it('groups the commands by tab', () => {
    const headings = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('h4')).map(h => h.textContent?.trim());
    expect(headings).toEqual(['Getting Started', 'Summary', 'Log Stream', 'Revisions', 'Routes', 'Variables', 'Services', 'Events']);
    expect(text()).toContain('cf env "my app"');
  });

  it('scales memory with -m and a unit, without -i', () => {
    expect(text()).toContain('cf scale "my app" -m [N]M');
    expect(text()).not.toContain('-i -m');
  });

  it('passes the endpoint\'s certificate and single sign-on settings to Getting Started', () => {
    expect(text()).toContain('cf api https://api.example.com --skip-ssl-validation');
    expect(text()).toContain('cf login --sso');
  });

  it('has a close button that goes back to the application', async () => {
    await renderHeader();
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    const close = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button[aria-label="Back to App"]');
    close?.click();

    expect(close).toBeTruthy();
    expect(router.serializeUrl(navigate.mock.calls[0][0] as UrlTree)).toBe('/applications/cf-guid/app-guid');
  });
});
