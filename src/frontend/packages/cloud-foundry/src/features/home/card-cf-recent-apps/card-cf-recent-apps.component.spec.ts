import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of as observableOf } from 'rxjs';

import { CardCfRecentAppsComponent } from './card-cf-recent-apps.component';
import { EndpointDataRegistry } from '../../../services/endpoint-data/endpoint-data.registry';
import { ActiveRouteCfOrgSpace } from '../../cf/cf-page.types';

describe('CardCfRecentAppsComponent', () => {
  let component: CardCfRecentAppsComponent;
  let fixture: ComponentFixture<CardCfRecentAppsComponent>;

  // Stub the registry — placeholderMode tests don't acquire endpoint data,
  // but the field-level inject() runs at construction and would otherwise
  // pull in EndpointDataShim → ngrx Store DI chain.
  const registryStub = {
    acquire: vi.fn(),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        CardCfRecentAppsComponent,
      ],
      providers: [
        provideZonelessChangeDetection(),
        { provide: EndpointDataRegistry, useValue: registryStub },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CardCfRecentAppsComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('allApps$', observableOf([]));
    fixture.componentRef.setInput('loading$', observableOf(false));
    fixture.componentRef.setInput('placeholderMode', true);

    // Don't call detectChanges() to avoid rendering child components
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

// Renders the real compact cards over the real stats registry, so the spec
// sees every /cf/app-stats request the card makes (#6019, #6021).
describe('CardCfRecentAppsComponent stats requests', () => {
  const app = (guid: string, state: string) => ({
    metadata: { guid, updated_at: '2026-01-01T00:00:00Z' },
    entity: { guid, name: guid, state, instances: 1, package_state: 'STAGED' },
  });

  let fixture: ComponentFixture<CardCfRecentAppsComponent>;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CardCfRecentAppsComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActiveRouteCfOrgSpace, useValue: null },
        { provide: EndpointDataRegistry, useValue: { acquire: vi.fn() } },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(CardCfRecentAppsComponent);
  });

  const statsRequests = () => httpMock.match(req => req.url.startsWith('/pp/v1/cf/app-stats/')).map(r => r.request.url);

  it('loads stats once per started app', async () => {
    fixture.componentRef.setInput('endpoint', 'ep-1');
    fixture.componentRef.setInput('allApps$', observableOf([app('a-started', 'STARTED'), app('b-stopped', 'STOPPED')]));
    await fixture.whenStable();
    expect(statsRequests()).toEqual(['/pp/v1/cf/app-stats/ep-1/a-started']);
  });

  it('makes no stats requests with noStats', async () => {
    fixture.componentRef.setInput('endpoint', 'ep-1');
    fixture.componentRef.setInput('noStats', true);
    fixture.componentRef.setInput('allApps$', observableOf([app('a-started', 'STARTED')]));
    await fixture.whenStable();
    expect(statsRequests()).toEqual([]);
    expect(fixture.nativeElement.textContent).toContain('a-started');
  });

  it('renders placeholder rows, with no stats requests, in placeholderMode', async () => {
    fixture.componentRef.setInput('placeholderMode', true);
    fixture.componentRef.setInput('maxRows', 3);
    await fixture.whenStable();
    expect(statsRequests()).toEqual([]);
    expect(fixture.nativeElement.querySelectorAll('.compact-app-card .ph-icon').length).toBe(3);
  });
});
