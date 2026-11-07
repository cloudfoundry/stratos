import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { Router } from '@angular/router';
import { Subject, of } from 'rxjs';
import { STORE_TEST_PROVIDERS, BASE_TEST_PROVIDERS } from "@test-framework/core-test.helper";

import { BaseTestModulesNoShared } from "@test-framework/core-test.helper";
import { CurrentUserPermissionsService } from '@stratosui/core';
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

  it('renders a gated tab only once hidden$ has answered false', async () => {
    const hidden$ = new Subject<boolean>();
    fixture.componentRef.setInput('tabs', [
      { link: 'summary', label: 'Summary' },
      { link: 'variables', label: 'Variables', hidden$ },
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
      { link: 'variables', label: 'Variables', hidden$: of(true) },
    ]);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelectorAll('li')).toHaveLength(1);
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
