import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { BaseTestModules, STORE_TEST_PROVIDERS } from '@test-framework';
import { MetricsEndpointProvider, MetricsService } from '../services/metrics-service';
import { MetricsEndpointDetailsComponent } from './metrics-endpoint-details.component';

describe('MetricsEndpointDetailsComponent', () => {
  const metricsEndpoints = signal<MetricsEndpointProvider[]>([]);
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
          useValue: { metricsEndpoints }
        },
        ...(STORE_TEST_PROVIDERS || []),
        provideZonelessChangeDetection(),
      ]
    });
    TestBed.compileComponents();
  });

  beforeEach(async () => {
    metricsEndpoints.set([]);
    fixture = TestBed.createComponent(MetricsEndpointDetailsComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('row', { guid: 'metrics-1' });
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // A connected metrics endpoint shows how many of the endpoints it lists
  // Stratos knows; nothing while it is not connected.
  it('counts the known sources once the metrics endpoint is connected', async () => {
    const text = () => (fixture.nativeElement as HTMLElement).textContent!.replace(/\s+/g, ' ').trim();
    const provider = (connectionStatus: string) => [{
      provider: { guid: 'metrics-1', connectionStatus, metadata: { metrics_stratos: '[]' } },
      endpoints: [{ guid: 'cf-1', name: 'cf', cnsi_type: 'cf', api_endpoint: { Scheme: 'https', Host: 'a.example.test', Path: '' } }],
    }] as unknown as MetricsEndpointProvider[];

    metricsEndpoints.set(provider('disconnected'));
    await fixture.whenStable();
    expect(text()).toBe('');

    metricsEndpoints.set(provider('connected'));
    await fixture.whenStable();
    expect(text()).toContain('1');
    expect(text()).toContain('source');

    metricsEndpoints.set(provider('disconnected'));
    await fixture.whenStable();
    expect(text()).toBe('');
  });
});
