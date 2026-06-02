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

  beforeEach(() => {
    // Wave 5 (W36-B): seed EndpointsDataService with empty signals to
    // satisfy the component's signal-bridge over the data service.
    const endpointsData = TestBed.inject(EndpointsDataService);
    Object.defineProperty(endpointsData, 'endpointsList', { value: signal([]) });
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
});
