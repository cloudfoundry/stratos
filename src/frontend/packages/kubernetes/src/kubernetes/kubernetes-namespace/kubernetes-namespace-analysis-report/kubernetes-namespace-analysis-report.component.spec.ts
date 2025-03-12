import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { MDAppModule } from '../../../../../core/src/public-api';
import { TabNavService } from '../../../../../core/src/tab-nav.service';
import { KubeBaseGuidMock, KubernetesBaseTestModules } from '../../kubernetes.testing.module';
import { KubernetesEndpointService } from '../../services/kubernetes-endpoint.service';
import { KubernetesNamespaceService } from '../../services/kubernetes-namespace.service';
import { KubernetesAnalysisService } from '../../services/kubernetes.analysis.service';
import {
  AnalysisReportSelectorComponent,
} from './../../analysis-report-viewer/analysis-report-selector/analysis-report-selector.component';
import { AnalysisReportViewerComponent } from './../../analysis-report-viewer/analysis-report-viewer.component';
import { KubernetesNamespaceAnalysisReportComponent } from './kubernetes-namespace-analysis-report.component';

describe('KubernetesNamespaceAnalysisReportComponent', () => {
  let component: KubernetesNamespaceAnalysisReportComponent;
  let fixture: ComponentFixture<KubernetesNamespaceAnalysisReportComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [KubernetesNamespaceAnalysisReportComponent, AnalysisReportSelectorComponent, AnalysisReportViewerComponent],
      imports: [
        KubernetesBaseTestModules,
        MDAppModule
      ],
      providers: [
        KubernetesAnalysisService,
        KubernetesEndpointService,
        KubeBaseGuidMock,
        KubernetesNamespaceService,
        TabNavService,
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesNamespaceAnalysisReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
