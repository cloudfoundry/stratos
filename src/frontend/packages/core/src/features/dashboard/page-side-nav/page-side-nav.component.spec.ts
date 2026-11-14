import { ComponentFixture, TestBed } from '@angular/core/testing';
import { inject, provideZonelessChangeDetection, signal } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { Router } from '@angular/router';
import { of, Subject } from 'rxjs';
import { STORE_TEST_PROVIDERS, BASE_TEST_PROVIDERS } from "@test-framework/core-test.helper";

import { BaseTestModulesNoShared } from "@test-framework/core-test.helper";
import { CurrentUserPermissionsService } from '@stratosui/core';
import { DashboardDataService } from '../../../core/dashboard-data.service';
import { TabNavService } from '../../../tab-nav.service';
import { PageSideNavComponent } from './page-side-nav.component';

describe('PageSideNavComponent', () => {
  let component: PageSideNavComponent;
  let fixture: ComponentFixture<PageSideNavComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        BaseTestModulesNoShared,
        PageSideNavComponent,
      ],
      providers: [
        ...BASE_TEST_PROVIDERS,
        TabNavService,
        CurrentUserPermissionsService,
        ...(STORE_TEST_PROVIDERS || []),
        provideZonelessChangeDetection(),
      ]
    });
      TestBed.compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(PageSideNavComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // The desktop layout applies from the first render and drops on a phone.
  it('takes the desktop layout unless the dashboard is mobile', async () => {
    const nav = () => fixture.nativeElement.querySelector('nav') as HTMLElement;
    expect(nav().classList).toContain('page-side-nav__desktop');

    TestBed.inject(DashboardDataService).enableMobileNav();
    await fixture.whenStable();
    expect(nav().classList).not.toContain('page-side-nav__desktop');

    TestBed.inject(DashboardDataService).disableMobileNav();
    await fixture.whenStable();
    expect(nav().classList).toContain('page-side-nav__desktop');
  });

  // An extension tab's hidden() returns a stream; the side-nav reads it as a
  // signal that is null until the stream answers.
  it('renders an extension tab only once its hidden() has answered false', async () => {
    const hidden$ = new Subject<boolean>();
    fixture.componentRef.setInput('tabs', [
      { link: 'summary', label: 'Summary' },
      { link: 'variables', label: 'Variables', hidden: () => hidden$ },
    ]);
    await fixture.whenStable();
    const gated = () => fixture.nativeElement.querySelector('[data-test="page-tab-Variables"]');

    // An ungated tab shows at once; a gated one waits for its answer.
    expect(fixture.nativeElement.querySelector('[data-test="page-tab-Summary"]')).not.toBeNull();
    expect(gated()).toBeNull();

    hidden$.next(false);
    await fixture.whenStable();
    expect(gated()).not.toBeNull();

    hidden$.next(true);
    await fixture.whenStable();
    expect(gated()).toBeNull();
  });

  it('runs an extension tab\'s hidden() where it may inject()', async () => {
    fixture.componentRef.setInput('tabs', [
      { link: 'variables', label: 'Variables', hidden: () => of(!inject(TabNavService)) },
    ]);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('[data-test="page-tab-Variables"]')).not.toBeNull();
  });

  it('follows a gate held as a signal', async () => {
    const isHidden = signal(true);
    fixture.componentRef.setInput('tabs', [
      { link: 'summary', label: 'Summary' },
      { link: 'users', label: 'Users', isHidden },
    ]);
    await fixture.whenStable();
    const gated = () => fixture.nativeElement.querySelector('[data-test="page-tab-Users"]');
    expect(gated()).toBeNull();

    isHidden.set(false);
    await fixture.whenStable();
    expect(gated()).not.toBeNull();
  });

  it('leaves the tabs in the page Tab order, one stop per tab', async () => {
    fixture.componentRef.setInput('tabs', [
      { link: 'summary', label: 'Summary' },
      { label: 'Settings' },
      { link: 'variables', label: 'Variables' },
    ]);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;

    // A positive tabindex puts an item ahead of the whole page, and a
    // focusable <li> is a stop where Enter does nothing.
    expect(el.querySelectorAll('[tabindex]')).toHaveLength(0);
    expect(el.querySelectorAll('a')).toHaveLength(2);
  });

  it('draws no list item for a hidden tab', async () => {
    fixture.componentRef.setInput('tabs', [
      { link: 'summary', label: 'Summary' },
      { link: 'variables', label: 'Variables', isHidden: signal(true) },
    ]);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelectorAll('li')).toHaveLength(1);
  });

  // Below the desktop width the tabs fold into a dropdown, which opened
  // on hover only.
  it('opens the compact tab list from a button, and Escape closes it', async () => {
    TestBed.inject(Router).resetConfig([{ path: '**', children: [] }]);
    fixture.componentRef.setInput('tabs', [
      { link: 'summary', label: 'Summary' },
      { link: 'variables', label: 'Variables' },
    ]);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    const button = el.querySelector<HTMLButtonElement>('button.page-side-nav__items-compact-header')!;
    const list = el.querySelector('ul')!;
    const isOpen = () => list.classList.contains('page-side-nav__items--open');

    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(button.getAttribute('aria-controls')).toBe(list.id);
    expect(button.querySelector('app-custom-icon')?.getAttribute('aria-hidden')).toBe('true');

    button.click();
    await fixture.whenStable();
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(isOpen()).toBe(true);

    el.querySelector<HTMLElement>('[data-test="page-tab-Variables"]')!.focus();
    el.querySelector('nav')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await fixture.whenStable();
    expect(isOpen()).toBe(false);
    expect(document.activeElement).toBe(button);

    // Choosing a tab closes the list.
    button.click();
    await fixture.whenStable();
    el.querySelector<HTMLElement>('[data-test="page-tab-Summary"]')!.click();
    await fixture.whenStable();
    expect(isOpen()).toBe(false);

    // Tabbing out of the nav closes the list, which would cover the page.
    button.click();
    await fixture.whenStable();
    const nav = el.querySelector('nav')!;
    nav.dispatchEvent(new FocusEvent('focusout', { relatedTarget: list.querySelector('a'), bubbles: true }));
    await fixture.whenStable();
    expect(isOpen()).toBe(true);
    nav.dispatchEvent(new FocusEvent('focusout', { relatedTarget: document.body, bubbles: true }));
    await fixture.whenStable();
    expect(isOpen()).toBe(false);
  });

  it('names each tab without its icon text', async () => {
    fixture.componentRef.setInput('tabs', [
      { link: 'summary', label: 'Summary', icon: 'cloud_foundry' },
      { link: 'events', label: 'Events' },
    ]);
    await fixture.whenStable();
    const icons = fixture.nativeElement.querySelectorAll('a app-custom-icon');
    expect(icons).toHaveLength(2);
    icons.forEach((icon: Element) => expect(icon.getAttribute('aria-hidden')).toBe('true'));
  });

  it('marks the current page tab for assistive technology', async () => {
    const router = TestBed.inject(Router);
    router.resetConfig([{ path: '**', children: [] }]);
    fixture.componentRef.setInput('header', 'Application');
    fixture.componentRef.setInput('tabs', [
      { link: 'summary', label: 'Summary' },
      { link: 'variables', label: 'Variables' },
    ]);
    await router.navigateByUrl('/variables');
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;

    expect(el.querySelector('nav')?.getAttribute('aria-label')).toBe('Application');
    expect(el.querySelector('[data-test="page-tab-Variables"]')?.getAttribute('aria-current')).toBe('page');
    expect(el.querySelector('[data-test="page-tab-Summary"]')?.hasAttribute('aria-current')).toBe(false);
  });

  it('keeps the tabs it shows until a list of another length arrives', async () => {
    fixture.componentRef.setInput('tabs', [{ link: 'summary', label: 'Summary' }]);
    await fixture.whenStable();
    const shown = component.shownTabs();
    expect(shown.map(tab => tab.label)).toEqual(['Summary']);

    // Same length: the gates already resolved are kept, not built again.
    fixture.componentRef.setInput('tabs', [{ link: 'summary', label: 'Summary' }]);
    await fixture.whenStable();
    expect(component.shownTabs()).toBe(shown);

    fixture.componentRef.setInput('tabs', [
      { link: 'summary', label: 'Summary' },
      { link: 'routes', label: 'Routes' },
    ]);
    await fixture.whenStable();
    expect(component.shownTabs().map(tab => tab.label)).toEqual(['Summary', 'Routes']);

    fixture.componentRef.setInput('tabs', null);
    await fixture.whenStable();
    expect(component.shownTabs()).toEqual([]);
  });
});
