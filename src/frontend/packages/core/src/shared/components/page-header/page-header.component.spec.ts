import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EmbeddedViewRef, provideZonelessChangeDetection, signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { CommonModule } from '@angular/common';

import { RecentlyVisitedDataService } from '@stratosui/store';
import { CoreTestingModule } from '@test-framework';
import { DashboardDataService } from '../../../core/dashboard-data.service';
import { EndpointsService } from '../../../core/endpoints.service';
import { CurrentUserPermissionsService } from '../../../core/permissions/current-user-permissions.service';
import { StratosCurrentUserPermissions } from '../../../core/permissions/stratos-user-permissions.checker';
import { TabNavService } from '../../../tab-nav.service';
import { UserProfileService } from '../../../core/user-profile.service';
import { GlobalEventService } from '../../global-events.service';
import { TailwindSnackBarService } from '../../services/tailwind-snackbar.service';
import { environment } from '../../../environments/environment';
import { PageHeaderComponent } from './page-header.component';

describe('PageHeaderComponent', () => {
  let component: PageHeaderComponent;
  let fixture: ComponentFixture<PageHeaderComponent>;
  const URL_KEY = 'key';
  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParams: { breadcrumbs: URL_KEY },
              data: {}
            }
          }
        },
        TabNavService,
        CurrentUserPermissionsService,
        EndpointsService,
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
      imports: [
        CoreTestingModule,
        CommonModule,
        RouterTestingModule,
        PageHeaderComponent,
      ]
    }).compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(PageHeaderComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  // API Keys and Sign Out in the user menu follow their permissions.
  it('gates API Keys and Sign Out on their permissions', async () => {
    const apiKeys = signal(false);
    const noLogout = signal(true);
    vi.spyOn(TestBed.inject(CurrentUserPermissionsService), 'can').mockImplementation(
      (action: unknown) => action === StratosCurrentUserPermissions.API_KEYS ? apiKeys : noLogout);
    const header = TestBed.createComponent(PageHeaderComponent);
    await header.whenStable();
    expect(header.componentInstance.canAPIKeys()).toBe(false);
    expect(header.componentInstance.canLogout()).toBe(false);

    apiKeys.set(true);
    noLogout.set(false);
    expect(header.componentInstance.canAPIKeys()).toBe(true);
    expect(header.componentInstance.canLogout()).toBe(true);
  });

  // The user menu shows the profile; a header without the menu fetches none.
  it('loads the user profile only while the user menu shows', async () => {
    const load = vi.spyOn(TestBed.inject(UserProfileService), 'loadUserProfile');
    const hidden = TestBed.createComponent(PageHeaderComponent);
    hidden.componentRef.setInput('hideMenu', true);
    await hidden.whenStable();
    expect(load).not.toHaveBeenCalled();

    hidden.componentRef.setInput('hideMenu', false);
    await hidden.whenStable();
    expect(load).toHaveBeenCalled();
  });

  it('shows the menu toggle only on a mobile viewport', async () => {
    // The header renders through a portal; instantiate its template directly.
    const view = component.pageHeaderTmpl().createEmbeddedView({});
    const host = document.createElement('div');
    view.detectChanges();
    view.rootNodes.forEach((node: Node) => host.appendChild(node));
    expect(host.querySelector('.page-header-nav-toggle-wrapper')).toBeNull();

    TestBed.inject(DashboardDataService).enableMobileNav();
    await fixture.whenStable();
    view.detectChanges();
    expect(host.querySelector('.page-header-nav-toggle-wrapper')).not.toBeNull();
    view.destroy();
  });

  it('has no breadcrumbs element while none are bound', () => {
    expect(component.breadcrumbDefinitions()).toBeNull();
  });

  it('should have 3 breadcrumbs', () => {
    fixture.componentRef.setInput('breadcrumbs', [
      {
        breadcrumbs: [
          {
            value: 'test'
          },
          {
            value: 'test2'
          },
          {
            value: 'test3'
          }
        ]
      },
      {
        key: 'fake',
        breadcrumbs: [
          {
            value: 'keyed'
          }
        ]
      }
    ]);
    expect(component.breadcrumbDefinitions()?.length).toEqual(3);
  });

  it('should have 2 breadcrumb', () => {
    fixture.componentRef.setInput('breadcrumbs', [
      {
        breadcrumbs: [
          {
            value: 'test'
          },
          {
            value: 'test2'
          },
          {
            value: 'test3'
          }
        ]
      },
      {
        key: URL_KEY,
        breadcrumbs: [
          {
            value: 'keyed'
          },
          {
            value: 'keyed123'
          }
        ]
      }
    ]);
    expect(component.breadcrumbDefinitions()?.length).toEqual(2);
  });

  it('publishes its tabs, with resolved links, and their header to the side navigation', async () => {
    fixture.componentRef.setInput('tabs', [
      { link: '/applications/summary', label: 'Summary' },
      { link: '-', label: 'Section' },
    ]);
    fixture.componentRef.setInput('tabsHeader', 'Application');
    await fixture.whenStable();

    const tabNav = TestBed.inject(TabNavService);
    expect(tabNav.tabNavs()?.map(tab => tab.link)).toEqual(['/applications/summary', TabNavService.TabsNoLinkValue]);
    expect(tabNav.tabHeader()).toBe('Application');
  });

  it('hides the history when told to, and always in the logout-only menu', () => {
    expect(component.historyVisible()).toBe(true);

    fixture.componentRef.setInput('showHistory', false);
    expect(component.historyVisible()).toBe(false);

    fixture.componentRef.setInput('showHistory', true);
    fixture.componentRef.setInput('logoutOnly', true);
    expect(component.historyVisible()).toBe(false);
  });

  describe('favorite', () => {
    const favorite = (guid: string, canFavorite = true) => ({
      guid,
      entityId: guid,
      entityType: 'application',
      endpointType: 'cf',
      endpointId: 'endpoint',
      metadata: { name: `name of ${guid}` },
      canFavorite: () => canFavorite,
      getLink: () => `/applications/${guid}`,
      getPrettyTypeName: () => 'Application',
    });
    let add: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      add = vi.spyOn(TestBed.inject(RecentlyVisitedDataService), 'add').mockImplementation(() => undefined);
    });

    afterEach(() => vi.restoreAllMocks());

    it('shows the star for a favorite and records it as recently visited', async () => {
      fixture.componentRef.setInput('favorite', favorite('a'));
      await fixture.whenStable();

      expect(component.shownFavorite()?.guid).toBe('a');
      expect(add).toHaveBeenCalledTimes(1);
      expect(add).toHaveBeenCalledWith(expect.objectContaining({
        guid: 'a', entityId: 'a', name: 'name of a', routerLink: '/applications/a', prettyType: 'Application',
      }));
    });

    it('keeps the favorite it shows when the same entity, or none, is bound again', async () => {
      const first = favorite('a');
      fixture.componentRef.setInput('favorite', first);
      await fixture.whenStable();

      fixture.componentRef.setInput('favorite', favorite('a'));
      await fixture.whenStable();
      fixture.componentRef.setInput('favorite', null);
      await fixture.whenStable();

      expect(component.shownFavorite()).toBe(first);
      expect(add).toHaveBeenCalledTimes(1);
    });

    it('ignores a favorite that cannot be favorited', async () => {
      fixture.componentRef.setInput('favorite', favorite('a', false));
      await fixture.whenStable();

      expect(component.shownFavorite()).toBeUndefined();
      expect(add).not.toHaveBeenCalled();
    });
  });

  describe('copyToken (UAA token menu)', () => {
    let httpMock: HttpTestingController;
    let writeTextMock: ReturnType<typeof vi.fn>;
    let snackSpy: ReturnType<typeof vi.spyOn>;
    const tokenUrl = `/api/${environment.proxyAPIVersion}/auth/token`;

    beforeEach(() => {
      httpMock = TestBed.inject(HttpTestingController);

      writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextMock },
        writable: true,
        configurable: true,
      });

      const snack = TestBed.inject(TailwindSnackBarService);
      snackSpy = vi.spyOn(snack, 'show');
    });

    afterEach(() => {
      // Absorb any pending company-config request from StratosBrandingService before verify
      httpMock.match('/assets/company-config.json');
      httpMock.verify();
      vi.restoreAllMocks();
    });

    it('toggleTokenMenu flips isTokenMenuOpen and closes the other menus', () => {
      component.isHistoryMenuOpen = true;
      component.isUserMenuOpen = true;
      component.toggleTokenMenu();

      expect(component.isTokenMenuOpen).toBe(true);
      expect(component.isHistoryMenuOpen).toBe(false);
      expect(component.isUserMenuOpen).toBe(false);

      component.closeTokenMenu();
      expect(component.isTokenMenuOpen).toBe(false);
    });

    it('copyToken copies the auth token value and shows a success snackbar', async () => {
      component.toggleTokenMenu();

      const promise = component.copyToken(component.authToken$, 'Auth token');
      const req = httpMock.expectOne(tokenUrl);
      expect(req.request.method).toBe('GET');
      req.flush({
        status: 'ok',
        error: '',
        data: { auth_token: 'auth-123', refresh_token: 'refresh-456', token_expiry: 1700000000 },
      });
      await promise;

      expect(writeTextMock).toHaveBeenCalledWith('auth-123');
      expect(snackSpy).toHaveBeenCalledWith('Auth token copied to clipboard', 'Close');
    });

    it('copyToken copies the refresh token value and shows a success snackbar', async () => {
      component.toggleTokenMenu();

      const promise = component.copyToken(component.refreshToken$, 'Refresh token');
      httpMock.expectOne(tokenUrl).flush({
        status: 'ok',
        error: '',
        data: { auth_token: 'auth-123', refresh_token: 'refresh-456', token_expiry: 1700000000 },
      });
      await promise;

      expect(writeTextMock).toHaveBeenCalledWith('refresh-456');
      expect(snackSpy).toHaveBeenCalledWith('Refresh token copied to clipboard', 'Close');
    });

    it('copyToken shows a "no value" snackbar when the token is empty', async () => {
      component.toggleTokenMenu();

      const promise = component.copyToken(component.authToken$, 'Auth token');
      httpMock.expectOne(tokenUrl).flush({
        status: 'error',
        error: 'no session',
        data: null,
      });
      await promise;

      expect(writeTextMock).not.toHaveBeenCalled();
      expect(snackSpy).toHaveBeenCalledWith('No Auth token available', 'Close');
    });

    it('copyToken shows a failure snackbar when the clipboard write rejects', async () => {
      writeTextMock.mockRejectedValueOnce(new Error('denied'));
      component.toggleTokenMenu();

      const promise = component.copyToken(component.authToken$, 'Auth token');
      httpMock.expectOne(tokenUrl).flush({
        status: 'ok',
        error: '',
        data: { auth_token: 'auth-123', refresh_token: 'refresh-456', token_expiry: 1700000000 },
      });
      await promise;

      expect(writeTextMock).toHaveBeenCalledWith('auth-123');
      expect(snackSpy).toHaveBeenCalledWith('Failed to copy Auth token', 'Close');
    });
  });

  // The user menu is a disclosure (#4170, WCAG 4.1.2): a named button that
  // says whether its panel is open, and Escape closes the panel.
  describe('user menu', () => {
    let host: HTMLElement;
    let view: EmbeddedViewRef<unknown>;

    const button = () => host.querySelector('#userMenu') as HTMLButtonElement;
    const panel = () => host.querySelector('#userMenuPanel');

    beforeEach(() => {
      // The header renders through a portal; instantiate its template directly.
      view = component.pageHeaderTmpl().createEmbeddedView({});
      view.detectChanges();
      host = document.createElement('div');
      view.rootNodes.forEach((node: Node) => host.appendChild(node));
      document.body.appendChild(host);
    });

    afterEach(() => {
      view.destroy();
      host.remove();
      TestBed.inject(HttpTestingController).match(() => true);
    });

    it('is a named button that reports its closed panel', () => {
      expect(button().getAttribute('aria-label')).toBe('User menu');
      expect(button().getAttribute('aria-expanded')).toBe('false');
      expect(button().getAttribute('aria-controls')).toBe('userMenuPanel');
      expect(panel()).toBeNull();
    });

    it('reports the panel open once toggled', () => {
      button().click();
      view.detectChanges();
      expect(button().getAttribute('aria-expanded')).toBe('true');
      expect(panel()).toBeTruthy();
    });

    it('closes the panel on Escape and puts focus back on the button', () => {
      button().click();
      view.detectChanges();
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      view.detectChanges();
      expect(button().getAttribute('aria-expanded')).toBe('false');
      expect(panel()).toBeNull();
      expect(document.activeElement).toBe(button());
    });

    // Items that go to a route are links, not buttons (a11y spec §3).
    it('offers About, Profile and API Keys as links', () => {
      button().click();
      view.detectChanges();
      const links = Array.from(panel()!.querySelectorAll('a[href]')).map(a => a.textContent?.trim());
      expect(links).toEqual(['About', 'Profile']);
      expect(panel()!.querySelectorAll('button[routerlink]').length).toBe(0);
    });
  });

  // The token and history panels follow the user menu's disclosure pattern.
  describe.each([
    { name: 'token menu', buttonId: 'tokenMenu', panelId: 'tokenMenuPanel', label: 'Copy UAA tokens' },
    { name: 'history menu', buttonId: 'historyMenu', panelId: 'historyMenuPanel', label: 'Recent activity' },
  ])('$name', ({ buttonId, panelId, label }) => {
    let host: HTMLElement;
    let view: EmbeddedViewRef<unknown>;

    const button = () => host.querySelector(`#${buttonId}`) as HTMLButtonElement;
    const panel = () => host.querySelector(`#${panelId}`);

    beforeEach(() => {
      view = component.pageHeaderTmpl().createEmbeddedView({});
      view.detectChanges();
      host = document.createElement('div');
      view.rootNodes.forEach((node: Node) => host.appendChild(node));
      document.body.appendChild(host);
    });

    afterEach(() => {
      view.destroy();
      host.remove();
      TestBed.inject(HttpTestingController).match(() => true);
    });

    it('is a named button that reports its panel open or closed', () => {
      expect(button().getAttribute('aria-label')).toBe(label);
      expect(button().getAttribute('aria-expanded')).toBe('false');
      expect(button().getAttribute('aria-controls')).toBe(panelId);
      expect(panel()).toBeNull();

      button().click();
      view.detectChanges();
      expect(button().getAttribute('aria-expanded')).toBe('true');
      expect(panel()).toBeTruthy();
    });

    it('closes the panel on Escape and puts focus back on the button', () => {
      button().click();
      view.detectChanges();
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      view.detectChanges();
      expect(button().getAttribute('aria-expanded')).toBe('false');
      expect(panel()).toBeNull();
      expect(document.activeElement).toBe(button());
    });
  });

  // Notifications goes to a route, so it is a link, and its name carries the
  // unread count that sighted users see on the badge (a11y spec §3).
  describe('notifications', () => {
    let host: HTMLElement;
    let view: EmbeddedViewRef<unknown>;

    beforeEach(() => {
      const events = TestBed.inject(GlobalEventService);
      ['a', 'b', 'c'].forEach(key => events.setStaticEvent(key, { key, message: key, link: '' }));
      events.updateEventReadState(events.events()[1], true);
      view = component.pageHeaderTmpl().createEmbeddedView({});
      view.detectChanges();
      host = document.createElement('div');
      view.rootNodes.forEach((node: Node) => host.appendChild(node));
      document.body.appendChild(host);
    });

    afterEach(() => {
      view.destroy();
      host.remove();
      TestBed.inject(HttpTestingController).match(() => true);
    });

    it('is a link to the events page named with the unread count', () => {
      const link = host.querySelector('a.page-header-notification-button') as HTMLAnchorElement;
      expect(link).toBeTruthy();
      expect(link.getAttribute('href')).toBe('/events');
      expect(link.getAttribute('aria-label')).toBe('Notifications, 2 unread');
      expect(host.querySelector('button.page-header-notification-button')).toBeNull();
    });
  });
});
