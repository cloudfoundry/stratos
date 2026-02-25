import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { EntityServiceFactory } from '@stratosui/store';
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
        EntityServiceFactory,
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

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesNodeMetricStatsCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
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
});
