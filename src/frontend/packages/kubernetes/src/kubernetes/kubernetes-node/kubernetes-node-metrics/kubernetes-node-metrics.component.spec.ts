import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { generateKubeStoreModules } from '../../kubernetes.testing.module';
import { BaseKubeGuid } from '../../kubernetes-page.types';
import { KubernetesEndpointService } from '../../services/kubernetes-endpoint.service';
import { KubernetesNodeService } from '../../services/kubernetes-node.service';
import { KubernetesNodeMetricsComponent } from './kubernetes-node-metrics.component';

describe('KubernetesNodeMetricsComponent', () => {
  let component: KubernetesNodeMetricsComponent;
  let fixture: ComponentFixture<KubernetesNodeMetricsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        KubernetesNodeMetricsComponent,
        ...generateKubeStoreModules(),
        NoopAnimationsModule,
      ],
      providers: [
        BaseKubeGuid,
        KubernetesEndpointService,
        KubernetesNodeService,
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
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideZonelessChangeDetection(),
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesNodeMetricsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
