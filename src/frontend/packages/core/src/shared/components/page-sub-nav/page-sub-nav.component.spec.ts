import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { RouterTestingModule } from '@angular/router/testing';

import { TabNavService } from '../../../tab-nav.service';
import { PageSubNavComponent } from './page-sub-nav.component';

describe('PageSubNavComponent', () => {
  let component: PageSubNavComponent;
  let fixture: ComponentFixture<PageSubNavComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        PageSubNavComponent,
      ],
      providers: [
        TabNavService,
        provideZonelessChangeDetection(),
      ]
    });
      TestBed.compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(PageSubNavComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('publishes nothing while no breadcrumbs are bound', () => {
    expect(TestBed.inject(TabNavService).tabSubNavBreadcrumbs()).toBeUndefined();
  });

  it('publishes its breadcrumbs to the dashboard', async () => {
    const crumbs = [{ value: 'Reports', routerLink: '/reports' }, { value: 'Report' }];
    fixture.componentRef.setInput('breadcrumbs', crumbs);
    await fixture.whenStable();

    expect(TestBed.inject(TabNavService).tabSubNavBreadcrumbs()).toBe(crumbs);
  });

  // #6126: a tabbed page can hold a sub-nav for every tab while a tab that
  // brings its own (Summary) shows that one instead, and gets the page's
  // back when it is left.
  it('hands the row back to the sub-nav that had it when a later one goes away', async () => {
    const tabNav = TestBed.inject(TabNavService);
    const outer = tabNav.tabSubNav();
    expect(outer).toBeTruthy();

    const inner = TestBed.createComponent(PageSubNavComponent);
    await inner.whenStable();
    expect(tabNav.tabSubNav()).not.toBe(outer);

    inner.destroy();
    expect(tabNav.tabSubNav()).toBe(outer);
  });

  it('clears the row when the last sub-nav goes away', () => {
    const tabNav = TestBed.inject(TabNavService);
    fixture.destroy();
    expect(tabNav.tabSubNav()).toBeUndefined();
  });

  it('leaves the row alone when another sub-nav has taken it over', async () => {
    const tabNav = TestBed.inject(TabNavService);
    const inner = TestBed.createComponent(PageSubNavComponent);
    await inner.whenStable();
    const innerPortal = tabNav.tabSubNav();

    fixture.destroy();
    expect(tabNav.tabSubNav()).toBe(innerPortal);
  });

  it('hands back the breadcrumbs with the row', async () => {
    const tabNav = TestBed.inject(TabNavService);
    const inner = TestBed.createComponent(PageSubNavComponent);
    inner.componentRef.setInput('breadcrumbs', [{ value: 'Quota' }]);
    await inner.whenStable();
    expect(tabNav.tabSubNavBreadcrumbs()).toEqual([{ value: 'Quota' }]);

    inner.destroy();
    expect(tabNav.tabSubNavBreadcrumbs()).toBeUndefined();
  });
});
