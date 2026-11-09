import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, TitleStrategy, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach } from 'vitest';

import { StratosBrandingService } from '../../theme/stratos-branding.service';
import { EndpointsDataService } from '@stratosui/store';

import { BrandedTitleStrategy, endpointTitle, paramTitle, tabTitle } from './title-strategy';

@Component({ standalone: true, template: '' })
class BlankComponent {}

// SC 2.4.2: each page has a title that names it, then the brand.
describe('BrandedTitleStrategy', () => {
  let brand: string;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([
          { path: 'create', title: 'Create application', component: BlankComponent },
          { path: 'plain', component: BlankComponent },
          { path: 'nodes/:nodeName', title: paramTitle('nodeName'), component: BlankComponent },
          { path: 'cells/:cellId', title: paramTitle('cellId', id => `Cell: ${id}`), component: BlankComponent },
          {
            path: 'cf',
            title: 'Cloud Foundry',
            children: [{ path: ':endpointId', title: endpointTitle(), component: BlankComponent }],
          },
          {
            path: 'apps/:id',
            title: () => of('my-app'),
            children: [
              { path: 'summary', title: tabTitle('Summary'), component: BlankComponent },
              { path: 'routes', title: tabTitle('Routes'), component: BlankComponent },
            ],
          },
        ]),
        { provide: TitleStrategy, useClass: BrandedTitleStrategy },
        {
          provide: EndpointsDataService,
          useValue: { waitFor: (guid: string) => guid === 'cf-1' ? Promise.resolve({ name: 'norm-lab' }) : Promise.reject(new Error('not found')) },
        },
      ],
    });
    const branding = TestBed.inject(StratosBrandingService).theme().branding;
    brand = branding.displayName || branding.companyName;
  });

  it('puts the route title before the brand', async () => {
    await TestBed.inject(Router).navigateByUrl('/create');
    TestBed.tick();
    expect(document.title).toBe(`Create application - ${brand}`);
  });

  it('uses the brand alone for a route with no title', async () => {
    await TestBed.inject(Router).navigateByUrl('/plain');
    TestBed.tick();
    expect(document.title).toBe(brand);
  });

  it('keeps the page title when the theme changes', async () => {
    await TestBed.inject(Router).navigateByUrl('/create');
    TestBed.tick();
    const branding = TestBed.inject(StratosBrandingService);
    branding.setTheme({ branding: { ...branding.getTheme().branding, displayName: 'ACME' } });
    TestBed.tick();
    expect(document.title).toBe('Create application - ACME');
  });

  it('puts a tab before the entity name it belongs to', async () => {
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/apps/1/summary');
    TestBed.tick();
    expect(document.title).toBe(`Summary - my-app - ${brand}`);
    // A tab change re-runs only the tab's resolver; the entity name stays.
    await router.navigateByUrl('/apps/1/routes');
    TestBed.tick();
    expect(document.title).toBe(`Routes - my-app - ${brand}`);
  });

  it('reads a title from a route parameter', async () => {
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/nodes/worker-1');
    TestBed.tick();
    expect(document.title).toBe(`worker-1 - ${brand}`);
    await router.navigateByUrl('/cells/cell-9');
    TestBed.tick();
    expect(document.title).toBe(`Cell: cell-9 - ${brand}`);
  });

  it('names an endpoint page after the endpoint, or the section when the guid is unknown', async () => {
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/cf/cf-1');
    TestBed.tick();
    expect(document.title).toBe(`norm-lab - ${brand}`);
    await router.navigateByUrl('/cf/missing');
    TestBed.tick();
    expect(document.title).toBe(`Cloud Foundry - ${brand}`);
  });
});
