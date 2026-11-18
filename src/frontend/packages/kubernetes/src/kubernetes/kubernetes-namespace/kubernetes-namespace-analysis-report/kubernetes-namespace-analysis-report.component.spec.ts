import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { TabNavService } from '../../../../../core/src/tab-nav.service';
import { KubeBaseGuidMock, KubernetesBaseTestModules } from '../../kubernetes.testing.module';
import { KubernetesEndpointService } from '../../services/kubernetes-endpoint.service';
import { KubernetesNamespaceService } from '../../services/kubernetes-namespace.service';
import { KubernetesAnalysisService } from '../../services/kubernetes.analysis.service';
import { AnalysisReportSelectorComponent } from '../../analysis-report-viewer/analysis-report-selector/analysis-report-selector.component';
import { AnalysisReportViewerComponent } from '../../analysis-report-viewer/analysis-report-viewer.component';
import { AnalysisReport } from '../../store/kube.types';
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

  it('hands the report picked in the selector to the viewer', async () => {
    const viewer = () => fixture.debugElement.query(By.directive(AnalysisReportViewerComponent))
      .componentInstance as AnalysisReportViewerComponent;
    const report = { id: 'r1', name: 'Report 1', type: 'popeye', format: 'other' } as unknown as AnalysisReport;
    const getByID = vi.spyOn(component.analyzerService, 'getByID').mockReturnValue(of(report));
    expect(viewer().report()).toBeNull();

    component.analysisChanged({ id: 'r1' } as never);
    await fixture.whenStable();

    expect(getByID).toHaveBeenCalledWith(component.endpointID, 'r1');
    expect(viewer().report()).toBe(report);
  });
});
