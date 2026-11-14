import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Injector, inject, provideZonelessChangeDetection, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { of } from 'rxjs';

import { entityCatalog, EntityCatalogHelper, EntityCatalogHelpers, EntityCatalogTestModule, generateStratosEntities, TEST_CATALOGUE_ENTITIES } from '@stratosui/store';
import { createBasicStoreModule, STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { CoreModule } from '../../../core/core.module';
import { SharedModule } from '../../../shared/shared.module';
import { TabNavService } from '../../../tab-nav.service';
import { CurrentUserPermissionsService } from '../../../core/permissions/current-user-permissions.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { MetricsEndpointProvider, MetricsService } from '../services/metrics-service';
import { MetricsComponent } from './metrics.component';

describe('MetricsComponent', () => {
  const metricsEndpoints = signal<MetricsEndpointProvider[]>([]);
  let component: MetricsComponent;
  let fixture: ComponentFixture<MetricsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        {
          ngModule: EntityCatalogTestModule,
          providers: [
            {
              provide: TEST_CATALOGUE_ENTITIES,
              useValue: [
                ...generateStratosEntities(),
              ]
            }
          ]
        },
        createBasicStoreModule(),
        RouterTestingModule,
        CoreModule,
        SharedModule,
        NoopAnimationsModule,
        MetricsComponent,
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { snapshot: { params: { metricsId: 'metrics-guid' } } } },
        {
          provide: MetricsService,
          useFactory: () => ({
            metricsEndpoints$: toObservable(metricsEndpoints, { injector: inject(Injector) }),
            metricsEndpoints,
          })
        },
        TabNavService,
        CurrentUserPermissionsService,
        EntityCatalogHelper,
        ...(STORE_TEST_PROVIDERS || []),
        provideZonelessChangeDetection(),
      ]
    });
    TestBed.compileComponents();

    // Initialize Entity Catalog Helper AFTER compileComponents
    const ech = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(ech);
  });

  beforeEach(async () => {
    metricsEndpoints.set([]);
    fixture = TestBed.createComponent(MetricsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => vi.restoreAllMocks());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // The endpoint name in the page header is the page heading (WCAG 1.3.1).
  it('puts the page title in a heading', async () => {
    await fixture.whenStable();
    // The header renders through a portal; instantiate its template to see the projected title.
    const header: PageHeaderComponent = fixture.debugElement.query(By.directive(PageHeaderComponent)).componentInstance;
    const headerView = header.pageHeaderTmpl().createEmbeddedView({});
    headerView.detectChanges();
    const h1 = headerView.rootNodes.map((node: Node) => (node as HTMLElement).querySelector?.('h1')).find(Boolean);
    expect(h1).toBeTruthy();
    headerView.destroy();
  });

  it('draws an endpoint icon in the font it names', async () => {
    metricsEndpoints.set([{
      provider: { guid: 'metrics-guid', name: 'metrics' },
      endpoints: [{ guid: 'cf-1', name: 'cf', cnsi_type: 'cf', api_endpoint: { Scheme: 'https', Host: 'api.example.test', Path: '' } }],
    } as unknown as MetricsEndpointProvider]);
    vi.spyOn(entityCatalog, 'getEndpoint').mockReturnValue({ definition: { label: 'Cloud Foundry', icon: 'cloud_foundry' } } as never);
    const iconFixture = TestBed.createComponent(MetricsComponent);
    await iconFixture.whenStable();

    const spans: HTMLElement[] = Array.from(iconFixture.nativeElement.querySelectorAll('span'));
    const icon = spans.find(span => span.textContent?.trim() === 'cloud_foundry');
    expect(icon).toBeTruthy();
    // Under material-icons the name splits into the "cloud" and "foundry" ligatures.
    expect(icon!.classList.contains('stratos-icons')).toBe(true);
    expect(icon!.classList.contains('material-icons')).toBe(false);
  });

  // A metrics endpoint that reports an error for its metadata file says so.
  it('says when the metrics endpoint provides no metadata file', async () => {
    metricsEndpoints.set([{
      provider: { guid: 'metrics-guid', name: 'metrics', metadata: { metrics_stratos: { error: 'no file' } } },
      endpoints: [],
    } as unknown as MetricsEndpointProvider]);
    const page = TestBed.createComponent(MetricsComponent);
    await page.whenStable();
    expect(page.nativeElement.textContent).toContain('does not provide a');
    expect(page.nativeElement.textContent).toContain('metadata file');

    metricsEndpoints.set([{ provider: { guid: 'metrics-guid', name: 'metrics' }, endpoints: [] } as unknown as MetricsEndpointProvider]);
    await page.whenStable();
    expect(page.nativeElement.textContent).not.toContain('metadata file');
  });
});
