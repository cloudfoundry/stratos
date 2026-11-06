import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { TabNavService } from '../../../../../core/src/tab-nav.service';
import { KubeBaseGuidMock, KubernetesBaseTestModules } from '../../kubernetes.testing.module';
import { KubernetesEndpointService } from '../../services/kubernetes-endpoint.service';
import { KubernetesNamespaceService } from '../../services/kubernetes-namespace.service';
import { KubernetesAnalysisService } from '../../services/kubernetes.analysis.service';
import { AnalysisReportSelectorComponent } from '../../analysis-report-viewer/analysis-report-selector/analysis-report-selector.component';
import { AnalysisReportViewerComponent } from '../../analysis-report-viewer/analysis-report-viewer.component';
import { KubernetesNamespaceAnalysisReportComponent } from './kubernetes-namespace-analysis-report.component';

describe('KubernetesNamespaceAnalysisReportComponent', () => {
  let component: KubernetesNamespaceAnalysisReportComponent;
  let fixture: ComponentFixture<KubernetesNamespaceAnalysisReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ...KubernetesBaseTestModules,
        KubernetesNamespaceAnalysisReportComponent,
        AnalysisReportSelectorComponent,
        AnalysisReportViewerComponent,
      ],
      providers: [
        KubernetesAnalysisService,
        KubernetesEndpointService,
        KubeBaseGuidMock,
        KubernetesNamespaceService,
        TabNavService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: {
                endpointId: 'test-endpoint-id',
                namespaceName: 'test-namespace'
              },
              queryParams: {}
            }
          }
        },
        provideZonelessChangeDetection(),
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesNamespaceAnalysisReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
