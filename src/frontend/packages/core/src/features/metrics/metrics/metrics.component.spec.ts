import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';

import { EntityCatalogHelper, EntityCatalogHelpers, EntityCatalogTestModule, generateStratosEntities, StratosStatus, TEST_CATALOGUE_ENTITIES } from '@stratosui/store';
import { createBasicStoreModule, STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { CoreModule } from '../../../core/core.module';
import { SharedModule } from '../../../shared/shared.module';
import { TabNavService } from '../../../tab-nav.service';
import { CurrentUserPermissionsService } from '../../../core/permissions/current-user-permissions.service';
import { MetricsEndpointProvider, MetricsService } from '../services/metrics-service';
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
        MetricsComponent,
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
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

  it('draws an endpoint icon in the font it names', async () => {
    const iconFixture = TestBed.createComponent(MetricsComponent);
    iconFixture.componentInstance.metricsEndpoint$ = of({
      provider: { guid: 'metrics-guid', name: 'metrics' },
      endpoints: []
    } as unknown as MetricsEndpointProvider);
    iconFixture.componentInstance.metricsInfo$ = of([{
      known: true,
      name: 'cf',
      url: 'https://api.example.test',
      icon: { name: 'cloud_foundry', font: 'stratos-icons' },
      metadata: {},
      status: of(StratosStatus.OK)
    }]);
    iconFixture.detectChanges();
    await iconFixture.whenStable();

    const spans: HTMLElement[] = Array.from(iconFixture.nativeElement.querySelectorAll('span'));
    const icon = spans.find(span => span.textContent?.trim() === 'cloud_foundry');
    expect(icon).toBeTruthy();
    // Under material-icons the name splits into the "cloud" and "foundry" ligatures.
    expect(icon!.classList.contains('stratos-icons')).toBe(true);
    expect(icon!.classList.contains('material-icons')).toBe(false);
  });
});
