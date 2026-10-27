import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ActivatedRoute } from '@angular/router';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { BaseTestModulesNoShared } from '../../../../../core/test-framework/core-test.helper';
import { SharedModule } from '@stratosui/core';
import { generateStratosEntities } from '../../../../../store/src/stratos-entity-generator';
import { EndpointsDataService, entityCatalog, TestEntityCatalog } from '../../../../../store/src/public-api';

import { HelmTestingModule } from '../../helm-testing.module';
import { MockChartService } from '../../monocular/shared/services/chart.service.mock';
import { ChartsService } from '../../monocular/shared/services/charts.service';
import { CatalogTabComponent } from './catalog-tab.component';
import { generateHelmEntities } from '../../helm-entity-generator';
import { HELM_ENDPOINT_TYPE, HELM_HUB_ENDPOINT_TYPE, HELM_REPO_ENDPOINT_TYPE } from '../../helm-entity-factory';

describe('CatalogTabComponent', () => {
  let component: CatalogTabComponent;
  let fixture: ComponentFixture<CatalogTabComponent>;

  beforeEach(async () => {
    // Register catalog entities before TestBed setup.
    const testEntityCatalog = entityCatalog as TestEntityCatalog;
    testEntityCatalog.clear();
    const entities = [
      ...generateStratosEntities(),
      ...generateHelmEntities(),
    ];
    entities.forEach(entity => entityCatalog.register(entity));

    await TestBed.configureTestingModule({
      imports: [
        ...BaseTestModulesNoShared,
        HelmTestingModule,
        SharedModule,
        CatalogTabComponent,
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ...STORE_TEST_PROVIDERS,
        { provide: ChartsService, useValue: new MockChartService() },
        { provide: ActivatedRoute, useValue: {
            snapshot: { params: {}, queryParams: {} }
          }
        },
        provideZonelessChangeDetection()
      ]
    }).compileComponents();
  });

  let endpointsList: ReturnType<typeof signal<any[]>>;

  beforeEach(() => {
    // Wave 5 (W36-B): seed EndpointsDataService with empty signals to
    // satisfy the component's signal-bridge over the data service.
    const endpointsData = TestBed.inject(EndpointsDataService);
    endpointsList = signal<any[]>([]);
    Object.defineProperty(endpointsData, 'endpointsList', { value: endpointsList });
    Object.defineProperty(endpointsData, 'loading', { value: signal(false) });

    fixture = TestBed.createComponent(CatalogTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    // Absorb any pending company-config request from StratosBrandingService
    const httpMock = TestBed.inject(HttpTestingController);
    httpMock.match(() => true);
    if (fixture) {
      fixture.destroy();
    }
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  const helmEndpoint = (guid: string, subType: string) => ({ guid, cnsi_type: HELM_ENDPOINT_TYPE, sub_type: subType });
  const sidebar = (): HTMLElement | null => fixture.nativeElement.querySelector('[data-test="repo-sidebar"]');

  it('shows the repository sidebar when there are several helm repositories', async () => {
    endpointsList.set([helmEndpoint('r1', HELM_REPO_ENDPOINT_TYPE), helmEndpoint('r2', HELM_REPO_ENDPOINT_TYPE)]);
    await fixture.whenStable();

    expect(sidebar()).not.toBeNull();
    expect(component.collapsed()).toBe(true);
  });

  it('names the repository filter once, by its field label', async () => {
    endpointsList.set([helmEndpoint('r1', HELM_REPO_ENDPOINT_TYPE), helmEndpoint('r2', HELM_REPO_ENDPOINT_TYPE)]);
    await fixture.whenStable();

    const text = sidebar()?.textContent ?? '';
    expect(text.match(/filter by repository/gi)?.length).toBe(1);
  });

  it('shows the repository sidebar expanded when Artifact Hub is connected', async () => {
    endpointsList.set([helmEndpoint('hub', HELM_HUB_ENDPOINT_TYPE)]);
    await fixture.whenStable();

    expect(sidebar()?.className).toContain('min-w-[200px]');
  });

  it('hides the repository sidebar when there is exactly one helm repository', async () => {
    endpointsList.set([helmEndpoint('r1', HELM_REPO_ENDPOINT_TYPE)]);
    await fixture.whenStable();

    expect(sidebar()).toBeNull();
  });
  it('expands the collapsed sidebar from the filter toggle', async () => {
    endpointsList.set([helmEndpoint('r1', HELM_REPO_ENDPOINT_TYPE), helmEndpoint('r2', HELM_REPO_ENDPOINT_TYPE)]);
    await fixture.whenStable();
    expect(sidebar()?.className).toContain('w-0');

    const toggle = [...fixture.nativeElement.querySelectorAll('button')]
      .find((b: HTMLElement) => b.textContent?.includes('filter_list')) as HTMLButtonElement;
    toggle.click();
    await fixture.whenStable();

    expect(sidebar()?.className).toContain('min-w-[200px]');
  });
});
