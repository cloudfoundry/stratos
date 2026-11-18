import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { ActivatedRoute } from '@angular/router';

import { SharedModule } from '../../../../../core/src/public-api';
import { SidePanelService } from '../../../../../core/src/shared/services/side-panel.service';
import { KubeBaseGuidMock, KubernetesBaseTestModules } from '../../kubernetes.testing.module';
import { KubernetesEndpointService } from '../../services/kubernetes-endpoint.service';
import { KubernetesAnalysisService } from '../../services/kubernetes.analysis.service';
import { AnalysisReportRunnerComponent } from './analysis-report-runner.component';

describe('AnalysisReportRunnerComponent', () => {
  let component: AnalysisReportRunnerComponent;
  let fixture: ComponentFixture<AnalysisReportRunnerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({imports: [
        SharedModule,
        KubernetesBaseTestModules,

        AnalysisReportRunnerComponent,
      ],
      providers: [

        KubernetesAnalysisService,
        KubernetesEndpointService,
        KubeBaseGuidMock,
        SidePanelService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: { endpointId: 'test' },
              queryParams: {}
            }
          }
        },

        provideZonelessChangeDetection(),
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AnalysisReportRunnerComponent);
    component = fixture.componentInstance;
    // Skip detectChanges — KubernetesAnalysisService subscribes to store
    // selectors via take(1) which throws EmptyError without full store setup
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

describe('AnalysisReportRunnerComponent analyzers', () => {
  const popeye = { id: 'popeye', name: 'PopEye', namespaceAware: true };
  const cluster = { id: 'cluster-only', name: 'Cluster', namespaceAware: false };

  const create = async (namespace?: string) => {
    await TestBed.configureTestingModule({
      imports: [AnalysisReportRunnerComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: SidePanelService, useValue: {} },
        {
          provide: KubernetesAnalysisService, useValue: {
            hideAnalysis: signal(false),
            analyzers: signal([popeye, cluster]),
            namespaceAnalyzers: signal([popeye]),
          }
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(AnalysisReportRunnerComponent);
    fixture.componentRef.setInput('kubeId', 'kube-1');
    if (namespace) {
      fixture.componentRef.setInput('namespace', namespace);
    }
    return fixture.componentInstance;
  };

  it('offers every analyzer for the cluster', async () => {
    const component = await create();
    expect(component.canShow()).toBe(true);
    expect(component.analyzers()?.map(a => a.id)).toEqual(['popeye', 'cluster-only']);
  });

  it('offers only the namespace-aware analyzers for a namespace', async () => {
    const component = await create('default');
    expect(component.analyzers()?.map(a => a.id)).toEqual(['popeye']);
  });
});
