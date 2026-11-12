import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach } from 'vitest';
import { firstValueFrom, of as observableOf } from 'rxjs';

import { EntityCatalogTestModule, TEST_CATALOGUE_ENTITIES, generateStratosEntities } from '@stratosui/store';
import { STORE_TEST_PROVIDERS, createBasicStoreModule } from '@stratosui/store/testing';
import { ActiveRouteCfCell, generateCFEntities } from '@test-framework/cf';
import { AppTestModule, CoreTestingModule } from '@test-framework';
import { getActiveRouteCfCellProvider } from '../../../../cf.helpers';
import { CloudFoundryEndpointService } from '../../../../services/cloud-foundry-endpoint.service';
import { CloudFoundryCellService } from '../cloud-foundry-cell.service';
import { CloudFoundryCellBaseComponent } from './cloud-foundry-cell-base.component';
import { CloudFoundryTestingModule } from '../../../../../../cloud-foundry-test.module';

// Mock CloudFoundryCellService
class MockCloudFoundryCellService {
  cfGuid = 'cfGuid';
  cellId = 'cellId';
  cellMetric$ = observableOf(null);
  error = signal<string | null>(null);
  healthy$ = observableOf(null);
  cpus$ = observableOf(null);
  usageContainers$ = observableOf(null);
  remainingContainers$ = observableOf(null);
  totalContainers$ = observableOf(null);
  usageDisk$ = observableOf(null);
  remainingDisk$ = observableOf(null);
  totalDisk$ = observableOf(null);
  usageMemory$ = observableOf(null);
  remainingMemory$ = observableOf(null);
  totalMemory$ = observableOf(null);
}

describe('CloudFoundryCellBaseComponent', () => {
  let component: CloudFoundryCellBaseComponent;
  let fixture: ComponentFixture<CloudFoundryCellBaseComponent>;

  let mockCellService: MockCloudFoundryCellService;
  const el = (): HTMLElement => fixture.nativeElement as HTMLElement;

  beforeEach(() => {
    mockCellService = new MockCloudFoundryCellService();
    TestBed.configureTestingModule({
      imports: [
        CloudFoundryCellBaseComponent,
        CoreTestingModule,
        createBasicStoreModule(),
        AppTestModule,
        CloudFoundryTestingModule,
        EntityCatalogTestModule,
        NoopAnimationsModule,
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        ...STORE_TEST_PROVIDERS,
        CloudFoundryEndpointService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: {
                endpointId: 'cfGuid',
                cellId: 'cellId'
              },
              queryParams: {}
            }
          }
        },
        {
          provide: TEST_CATALOGUE_ENTITIES,
          useFactory: () => [
            ...generateStratosEntities(),
            ...generateCFEntities()
          ]
        },
        ActiveRouteCfCell,
      ]
    });
    TestBed.overrideComponent(CloudFoundryCellBaseComponent, {
      set: {
        providers: [
          getActiveRouteCfCellProvider,
          { provide: CloudFoundryCellService, useFactory: () => mockCellService },
        ],
      },
    });
    TestBed.compileComponents();
  });

  const create = async () => {
    fixture = TestBed.createComponent(CloudFoundryCellBaseComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  };

  it('should create', async () => {
    await create();
    expect(component).toBeTruthy();
    expect(el().querySelector('[data-test="cell-metrics-error"]')).toBeNull();
  });

  it('shows the cell metrics error and names the cell from the route when metrics fail', async () => {
    mockCellService.error.set('Failed to load the metrics for this cell (HTTP 500)');
    await create();
    expect(el().querySelector('[data-test="cell-metrics-error"]')?.textContent)
      .toContain('Failed to load the metrics for this cell (HTTP 500)');
    // The header is rendered through a portal outside the fixture, so
    // check the name it binds.
    expect(await firstValueFrom(component.name$)).toBe('cellId');
  });

  // Breadcrumb back to the endpoint's cells; the App Instances tab is for
  // admins only and stays hidden until the endpoint's user is known.
  it('links back to the endpoint\'s cells and shows App Instances to an admin only', async () => {
    const endpoint = signal<unknown>(undefined);
    TestBed.overrideProvider(CloudFoundryEndpointService, { useValue: { endpoint } });
    await create();
    const appsTab = component.tabLinks.find(t => t.link === CloudFoundryCellBaseComponent.AppsLinks)!;
    await fixture.whenStable();
    expect(component.breadcrumbs()).toBeNull();
    expect(appsTab.isHidden!()).toBe(true);

    endpoint.set({ entity: { guid: 'cf-1', name: 'cf one', user: { admin: true } } });
    await fixture.whenStable();
    expect(component.breadcrumbs()).toEqual([{ breadcrumbs: [{ value: 'cf one', routerLink: '/cloud-foundry/cf-1/cells' }] }]);
    expect(appsTab.isHidden!()).toBe(false);

    endpoint.set({ entity: { guid: 'cf-1', name: 'cf one', user: { admin: false } } });
    await fixture.whenStable();
    expect(appsTab.isHidden!()).toBe(true);
  });
});
