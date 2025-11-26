import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { BaseTestModules, STORE_TEST_PROVIDERS } from '@test-framework';
import { MetricsService } from '../services/metrics-service';
import { MetricsEndpointDetailsComponent } from './metrics-endpoint-details.component';

describe('MetricsEndpointDetailsComponent', () => {
  let component: MetricsEndpointDetailsComponent;
  let fixture: ComponentFixture<MetricsEndpointDetailsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ...BaseTestModules,
        MetricsEndpointDetailsComponent,
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
        ...(STORE_TEST_PROVIDERS || []),
        provideZonelessChangeDetection(),
      ]
    });
    TestBed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MetricsEndpointDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
