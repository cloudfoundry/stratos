import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { NEVER, Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { BaseTestModules } from '../../../../../../core/test-framework/core-test.helper';
import { KubernetesNodeMetricStatsCardComponent } from './kubernetes-node-metric-stats-card.component';
import { KubernetesNodeSimpleMetricComponent } from '../kubernetes-node-simple-metric/kubernetes-node-simple-metric.component';
import { KubernetesNodeService } from '../../../services/kubernetes-node.service';
import { BaseKubeGuid } from '../../../kubernetes-page.types';
import { KubernetesEndpointService } from '../../../services/kubernetes-endpoint.service';
import { KubernetesTestingModule } from '../../../kubernetes.testing.module';

describe('KubernetesNodeMetricStatsCardComponent', () => {
  let component: KubernetesNodeMetricStatsCardComponent;
  let fixture: ComponentFixture<KubernetesNodeMetricStatsCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        KubernetesNodeMetricStatsCardComponent,
        KubernetesNodeSimpleMetricComponent,
        ...BaseTestModules,
        KubernetesTestingModule,
      ],
      providers: [
        KubernetesNodeService,
        KubernetesEndpointService,
        BaseKubeGuid,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParams: {},
              params: {
                nodeName: 'test-node'
              }
            }
          }
        },
        provideZonelessChangeDetection(),
      ]
    }).compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(KubernetesNodeMetricStatsCardComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    // Ensure we destroy the component and clean up the polling subscription
    if (fixture) {
      fixture.destroy();
    }
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows why the metric failed to load instead of blank values', async () => {
    fixture.destroy();
    const error = signal<string | null>('Error proxing request: dial tcp: i/o timeout (500)');
    TestBed.inject(KubernetesNodeService).setupMetricObservable = () =>
      ({ entity$: NEVER, pollerSub: new Subscription(), error });
    fixture = TestBed.createComponent(KubernetesNodeMetricStatsCardComponent);
    fixture.componentInstance.metric = 'container_memory_usage_bytes' as any;
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).querySelector('[data-test="node-metric-error"]')?.textContent)
      .toContain('Failed to load: Error proxing request: dial tcp: i/o timeout (500)');
  });
});
