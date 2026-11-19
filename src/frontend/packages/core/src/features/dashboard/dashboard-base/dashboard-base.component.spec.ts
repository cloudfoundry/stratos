import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { afterEach, describe, it, expect, beforeEach, vi } from 'vitest';
import { Router } from '@angular/router';
import { EntityCatalogHelper, EntityCatalogHelpers } from '@stratosui/store';
import { BaseTestModulesNoShared, STORE_TEST_PROVIDERS, BASE_TEST_PROVIDERS } from '@test-framework/core-test.helper';
import { DashboardDataService } from '../../../core/dashboard-data.service';
import { PageHeaderService } from '../../../core/page-header-service/page-header.service';
import { SidePanelService } from '../../../shared/services/side-panel.service';
import { SharedModule } from '../../../shared/shared.module';
import { TabNavService } from '../../../tab-nav.service';
import { MetricsService } from '../../metrics/services/metrics-service';
import { PageSideNavComponent } from '../page-side-nav/page-side-nav.component';
import { SideNavComponent } from '../side-nav/side-nav.component';
import { DashboardBaseComponent } from './dashboard-base.component';

describe('DashboardBaseComponent', () => {
  let component: DashboardBaseComponent;
  let fixture: ComponentFixture<DashboardBaseComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ...BaseTestModulesNoShared,
        SharedModule,
        DashboardBaseComponent,
        SideNavComponent,
        PageSideNavComponent,
      ],
      providers: [
        PageHeaderService,
        MetricsService,
        TabNavService,
        SidePanelService,
        ...STORE_TEST_PROVIDERS,
        ...BASE_TEST_PROVIDERS,
        provideZonelessChangeDetection(),
      ],
    });

    // Set up entity catalog helper from DI
    // Entities are registered automatically via BaseTestModulesNoShared's CATALOGUE_ENTITIES provider
    const helper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(helper);

    TestBed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardBaseComponent);
    component = fixture.componentInstance;
    // Not rendered here: the first render runs ngOnInit, which requires full catalog setup
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  // The main navigation follows the dashboard state: a drawer on a phone,
  // pinned beside the page or over it on a desktop.
  it('derives the main navigation from the dashboard state', () => {
    const data = TestBed.inject(DashboardDataService);
    data.setSideNavPinned(true);
    expect(component.mainNavState().mode).toBe('side');
    data.setSideNavPinned(false);
    expect(component.mainNavState().mode).toBe('over');

    data.enableMobileNav();
    expect(component.mainNavState()).toEqual({ mode: 'over', opened: false, iconMode: false });
  });

  // WCAG 2.4.3 / 2.4.7: on a narrow view the closed drawer only slides off
  // screen, so Tab walked its links with the focus drawn nowhere.
  describe('main navigation drawer', () => {
    const drawer = (): HTMLElement => fixture.nativeElement.querySelector('.dashboard-side-nav');

    it('is out of the tab order and accessibility tree while closed', async () => {
      TestBed.inject(DashboardDataService).enableMobileNav();
      await fixture.whenStable();
      expect(drawer().hasAttribute('inert')).toBe(true);
    });

    it('is reachable while open', async () => {
      const data = TestBed.inject(DashboardDataService);
      data.enableMobileNav();
      data.toggleSideNav();
      await fixture.whenStable();
      expect(drawer().hasAttribute('inert')).toBe(false);
    });

    it('is reachable beside the page on a wide view', async () => {
      await fixture.whenStable();
      expect(drawer().hasAttribute('inert')).toBe(false);
    });

    // The open drawer covers the page and its own Toggle menu button, so
    // focus moves with it: in on open, back out on close.
    describe('open on a narrow view', () => {
      let data: DashboardDataService;
      let toggle: HTMLButtonElement;

      beforeEach(async () => {
        document.body.appendChild(fixture.nativeElement);
        toggle = document.createElement('button');
        toggle.setAttribute('aria-controls', 'main-nav-drawer');
        document.body.appendChild(toggle);
        data = TestBed.inject(DashboardDataService);
        data.enableMobileNav();
        await fixture.whenStable();
        toggle.focus();
        data.toggleSideNav();
        await fixture.whenStable();
      });

      afterEach(() => {
        fixture.nativeElement.remove();
        toggle.remove();
      });

      it('takes focus to its first item when it opens', () => {
        expect(drawer().contains(document.activeElement)).toBe(true);
      });

      it('closes on Escape and returns focus to Toggle menu', async () => {
        document.activeElement!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        await fixture.whenStable();
        expect(drawer().hasAttribute('inert')).toBe(true);
        expect(document.activeElement).toBe(toggle);
      });

      // WCAG 2.4.11: the open drawer covers page controls that Tab still
      // reaches; Escape from anywhere reveals them without moving focus.
      it('closes on Escape from the page and leaves focus where it is', async () => {
        const outside = document.createElement('button');
        document.body.appendChild(outside);
        outside.focus();
        outside.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        await fixture.whenStable();
        expect(drawer().hasAttribute('inert')).toBe(true);
        expect(document.activeElement).toBe(outside);
        outside.remove();
      });

      it('returns focus to Toggle menu when a control inside closes it', async () => {
        data.toggleSideNav();
        await fixture.whenStable();
        expect(document.activeElement).toBe(toggle);
      });

      it('closes when a link is chosen and gives focus to the new page', async () => {
        await TestBed.inject(Router).navigateByUrl('/');
        await fixture.whenStable();
        expect(drawer().hasAttribute('inert')).toBe(true);
        expect(document.activeElement).toBe(fixture.nativeElement.querySelector('main#main-content'));
      });
    });
  });

  describe('side panel', () => {
    const panel = (): HTMLElement => fixture.nativeElement.querySelector('.dashboard-side-help-outer');

    beforeEach(async () => {
      await fixture.whenStable();
    });

    // The closed panel sits off screen but was a role="button" tabindex="0"
    // div, so Tab landed in it and its whole text became one button name.
    it('is a labelled panel, not a button', () => {
      expect(panel().getAttribute('role')).not.toBe('button');
      expect(panel().hasAttribute('tabindex')).toBe(false);
      expect(panel().tagName).toBe('ASIDE');
      expect(panel().getAttribute('aria-label')).toBeTruthy();
    });

    it('is out of the tab order and accessibility tree while closed', () => {
      expect(panel().hasAttribute('inert')).toBe(true);
    });

    it('is reachable while open', async () => {
      TestBed.inject(SidePanelService).open();
      await fixture.whenStable();
      expect(panel().hasAttribute('inert')).toBe(false);
    });
  });

  // WCAG 2.4.1 Bypass Blocks (#4176): the first Tab stop skips the side nav
  // and header and lands on the page content.
  describe('skip link', () => {
    const root = (): HTMLElement => fixture.nativeElement;
    const focusable = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

    beforeEach(async () => {
      document.body.appendChild(root());
      await fixture.whenStable();
    });

    afterEach(() => {
      root().remove();
    });

    it('is the first focusable element and names the page content', () => {
      const first = root().querySelector(focusable) as HTMLAnchorElement;
      expect(first?.textContent?.trim()).toBe('Skip to main content');
      expect(first.getAttribute('href')).toBe('#main-content');
    });

    it('targets a main landmark that wraps the routed page and can take focus', () => {
      const main = root().querySelector('main#main-content') as HTMLElement;
      expect(main).toBeTruthy();
      expect(main.getAttribute('tabindex')).toBe('-1');
      expect(main.querySelector('router-outlet')).toBeTruthy();
    });

    it('moves focus to the main landmark when used', () => {
      const link = root().querySelector('a[href="#main-content"]') as HTMLAnchorElement;
      link.click();
      expect(document.activeElement).toBe(root().querySelector('main#main-content'));
    });
  });

  // WCAG 2.1.1 Keyboard: a page that scrolls but holds nothing focusable
  // (build packs, feature flags, quotas) gives the keyboard no way to
  // scroll it, so main joins the tab order for as long as that is true.
  describe('scroll area', () => {
    const main = (): HTMLElement => fixture.nativeElement.querySelector('main#main-content');
    const scrolls = (el: HTMLElement, yes: boolean) => {
      Object.defineProperty(el, 'clientHeight', { configurable: true, value: 100 });
      Object.defineProperty(el, 'scrollHeight', { configurable: true, value: yes ? 500 : 100 });
    };
    const update = async () => {
      component.onContentScroll({ target: main() } as unknown as Event);
      await fixture.whenStable();
    };

    beforeEach(async () => {
      await fixture.whenStable();
    });

    it('takes a tab stop while it scrolls and holds nothing focusable', async () => {
      scrolls(main(), true);
      await update();
      expect(main().getAttribute('tabindex')).toBe('0');
    });

    it('stays out of the tab order while it holds something focusable', async () => {
      scrolls(main(), true);
      main().firstElementChild!.appendChild(document.createElement('button'));
      await update();
      expect(main().getAttribute('tabindex')).toBe('-1');
    });

    it('leaves the tab order again when it stops scrolling', async () => {
      scrolls(main(), true);
      await update();
      scrolls(main(), false);
      await update();
      expect(main().getAttribute('tabindex')).toBe('-1');
    });
  });
});
