import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';

import { TabNavService } from './tab-nav.service';

@Component({ template: '', standalone: true })
class BlankComponent { }

describe('TabNavService', () => {
  let service: TabNavService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([
          { path: 'summary', component: BlankComponent },
          { path: 'users', component: BlankComponent },
        ]),
      ],
    });
    service = TestBed.inject(TabNavService);
    router = TestBed.inject(Router);
  });

  it('follows the active tab as the router navigates', async () => {
    service.setTabs([
      { label: 'Summary', link: '/summary' },
      { label: 'Gap', link: TabNavService.TabsNoLinkValue },
      { label: 'Users', link: '/users' },
    ]);
    expect(service.currentTabHeader()).toBeNull();

    await router.navigateByUrl('/summary');
    expect(service.currentTabHeader()?.label).toBe('Summary');

    await router.navigateByUrl('/users');
    expect(service.currentTabHeader()?.label).toBe('Users');
  });

  it('has no active tab without tabs', async () => {
    await router.navigateByUrl('/summary');
    expect(service.currentTabHeader()).toBeNull();
  });
});
