import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MDAppModule } from './../../../../core/md.module';

import { KubernetesNamespaceAnalysisReportComponent } from './kubernetes-namespace-analysis-report.component';
import { KubernetesBaseTestModules, KubeBaseGuidMock } from '../../kubernetes.testing.module';
import { KubernetesAnalysisService } from '../../services/kubernetes.analysis.service';
import { KubernetesEndpointService } from '../../services/kubernetes-endpoint.service';
import {
  AnalysisReportSelectorComponent
} from './../../analysis-report-viewer/analysis-report-selector/analysis-report-selector.component';
import { AnalysisReportViewerComponent } from './../../analysis-report-viewer/analysis-report-viewer.component';
import { KubernetesNamespaceService } from '../../services/kubernetes-namespace.service';
import { TabNavService } from 'frontend/packages/core/tab-nav.service';

describe('KubernetesNamespaceAnalysisReportComponent', () => {
  let component: KubernetesNamespaceAnalysisReportComponent;
  let fixture: ComponentFixture<KubernetesNamespaceAnalysisReportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KubernetesNamespaceAnalysisReportComponent, AnalysisReportSelectorComponent, AnalysisReportViewerComponent ],
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
