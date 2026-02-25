import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { BaseTestModulesNoShared } from '../../../../../core/test-framework/core-test.helper';
import { SharedModule } from '@stratosui/core';
import { stratosEntityCatalog } from '../../../../../store/src/stratos-entity-catalog';
import { generateStratosEntities } from '../../../../../store/src/stratos-entity-generator';
import { entityCatalog, TestEntityCatalog } from '../../../../../store/src/public-api';

import { HelmTestingModule } from '../../helm-testing.module';
import { MockChartService } from '../../monocular/shared/services/chart.service.mock';
import { ChartsService } from '../../monocular/shared/services/charts.service';
import { CatalogTabComponent } from './catalog-tab.component';
import { helmEntityCatalog } from '../../helm-entity-catalog';
import { generateHelmEntities } from '../../helm-entity-generator';

describe('CatalogTabComponent', () => {
  let component: CatalogTabComponent;
  let fixture: ComponentFixture<CatalogTabComponent>;
  let mockPaginationService: any;
  let mockChartMonitor: any;

  beforeEach(async () => {
    // Manually register catalog entities before TestBed setup
    // This ensures stratosEntityCatalog.endpoint and helmEntityCatalog.chart are defined
    const testEntityCatalog = entityCatalog as TestEntityCatalog;
    testEntityCatalog.clear();
    const entities = [
      ...generateStratosEntities(),
      ...generateHelmEntities(),
    ];
    entities.forEach(entity => entityCatalog.register(entity));

    // Create persistent mock observables at test suite level to prevent garbage collection
    // Use BehaviorSubject to keep observables alive throughout the test
    mockPaginationService = {
      entities$: new BehaviorSubject([]),
      fetchingEntities$: new BehaviorSubject(false),
      pagination$: new BehaviorSubject(null),
      hasEntities$: new BehaviorSubject(false),
      totalEntities$: new BehaviorSubject(0),
      isMultiAction$: new BehaviorSubject(false)
    };

    mockChartMonitor = {
      currentPage$: new BehaviorSubject([]),
      pagination$: new BehaviorSubject({
        clientPagination: {
          filter: {
            string: '',
            items: {}
          }
        }
      }),
      fetchingEntities$: new BehaviorSubject(false),
      hasEntities$: new BehaviorSubject(false),
      totalEntities$: new BehaviorSubject(0)
    };

    // Mock the catalog methods to return our persistent observables
    vi.spyOn(stratosEntityCatalog.endpoint.store.getAll, 'getPaginationService').mockReturnValue(mockPaginationService);
    vi.spyOn(helmEntityCatalog.chart.store, 'getPaginationMonitor').mockReturnValue(mockChartMonitor);

    await TestBed.configureTestingModule({
      imports: [
        ...BaseTestModulesNoShared,
        HelmTestingModule,
        SharedModule,
        CatalogTabComponent,
      ],
      providers: [
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

  beforeEach(() => {
    fixture = TestBed.createComponent(CatalogTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    // Properly clean up to prevent async errors
    // Complete all BehaviorSubjects before destroying the fixture
    if (mockPaginationService) {
      mockPaginationService.entities$.complete();
      mockPaginationService.fetchingEntities$.complete();
      mockPaginationService.pagination$.complete();
      mockPaginationService.hasEntities$.complete();
      mockPaginationService.totalEntities$.complete();
      mockPaginationService.isMultiAction$.complete();
    }
    if (mockChartMonitor) {
      mockChartMonitor.currentPage$.complete();
      mockChartMonitor.pagination$.complete();
      mockChartMonitor.fetchingEntities$.complete();
      mockChartMonitor.hasEntities$.complete();
      mockChartMonitor.totalEntities$.complete();
    }
    if (fixture) {
      fixture.destroy();
    }
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
