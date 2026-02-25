import { HttpClientModule } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';

import {
  EntityCatalogHelper,
  EntityCatalogHelpers,
  EntityCatalogTestModule,
  EntityServiceFactory,
  generateStratosEntities,
  TEST_CATALOGUE_ENTITIES
} from '@stratosui/store';
import { createBasicStoreModule, STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { CoreModule } from '../../../core/core.module';
import { SharedModule } from '../../../shared/shared.module';
import { TabNavService } from '../../../tab-nav.service';
import { CurrentUserPermissionsService } from '../../../core/permissions/current-user-permissions.service';
import { MetricsService } from '../services/metrics-service';
import { MetricsComponent } from './metrics.component';

describe('MetricsComponent', () => {
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
        HttpClientModule,
        MetricsComponent,
      ],
      providers: [
        {
          provide: MetricsService,
          useValue: {
            metricsEndpoints$: of([]),
            haveNoMetricsEndpoints$: of(false),
            haveNoConnectedMetricsEndpoints$: of(false)
          }
        },
        TabNavService,
        CurrentUserPermissionsService,
        EntityServiceFactory,
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

  beforeEach(() => {
    fixture = TestBed.createComponent(MetricsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
