import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NavigationEnd, NavigationStart, provideRouter, Route, Router, Routes } from '@angular/router';
import { describe, expect, it } from 'vitest';

import { dynamicExtensionRoutesGuard } from './dynamic-extension-routes';

@Component({ template: 'page' })
class PageComponent { }

@Component({ template: 'not found' })
class NotFoundComponent { }

describe('dynamicExtensionRoutesGuard', () => {
  // A section's own catch-all, as the feature route files declare it.
  const sectionCatchAll = (): Route => ({
    path: '**',
    component: PageComponent,
    canActivate: [dynamicExtensionRoutesGuard],
  });

  // Where an unknown address under `section` ends up. The guard removes its
  // catch-all and navigates again, so the address should fall through to the
  // application's "not found" route. Rejects if the guard keeps navigating.
  function settle(section: Route): Promise<unknown> {
    const routes: Routes = [section, { path: '**', component: NotFoundComponent }];
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter(routes)],
    });
    const router = TestBed.inject(Router);
    return new Promise((resolve, reject) => {
      let starts = 0;
      router.events.subscribe(event => {
        if (event instanceof NavigationStart && ++starts > 5) {
          router.dispose();
          reject(new Error('the guard navigated to the same address more than 5 times'));
        }
        if (event instanceof NavigationEnd) {
          resolve(router.routerState.snapshot.root.firstChild?.component);
        }
      });
      router.navigateByUrl('/section/no-such-page');
    });
  }

  it('falls through to "not found" when the section declares its routes as children', async () => {
    const section: Route = {
      path: 'section',
      children: [{ path: 'page', component: PageComponent }, sectionCatchAll()],
    };

    expect(await settle(section)).toBe(NotFoundComponent);
  });

  it('falls through to "not found" when the section is lazy-loaded', async () => {
    const section: Route = {
      path: 'section',
      loadChildren: () => Promise.resolve([{ path: 'page', component: PageComponent }, sectionCatchAll()]),
    };

    expect(await settle(section)).toBe(NotFoundComponent);
  });
});
