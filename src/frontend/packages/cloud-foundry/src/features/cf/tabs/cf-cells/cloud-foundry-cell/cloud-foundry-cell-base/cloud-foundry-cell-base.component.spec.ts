import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach } from 'vitest';
import { of as observableOf } from 'rxjs';

import { EntityCatalogTestModule, TEST_CATALOGUE_ENTITIES, generateStratosEntities } from '@stratosui/store';
import { STORE_TEST_PROVIDERS, createBasicStoreModule } from '@stratosui/store/testing';
import { ActiveRouteCfCell, generateCFEntities } from '@test-framework/cf';
import { AppTestModule, CoreTestingModule } from '@test-framework';
import { CloudFoundryEndpointService } from '../../../../services/cloud-foundry-endpoint.service';
import { CloudFoundryCellService } from '../cloud-foundry-cell.service';
import { CloudFoundryCellBaseComponent } from './cloud-foundry-cell-base.component';
import { CloudFoundryTestingModule } from '../../../../../../cloud-foundry-test.module';

// Mock CloudFoundryCellService
class MockCloudFoundryCellService {
  cfGuid = 'cfGuid';
  cellId = 'cellId';
  cellMetric$ = observableOf(null);
  healthy$ = observableOf(null);
  healthyMetricId = null;
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

  beforeEach(() => {
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
        ...STORE_TEST_PROVIDERS,
        CloudFoundryEndpointService,
        {
          provide: CloudFoundryCellService,
          useValue: new MockCloudFoundryCellService(),
        },
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
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundryCellBaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
