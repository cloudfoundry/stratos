import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HelmReleaseAnalysisTabComponent } from './helm-release-analysis-tab.component';
import { AnalysisReportSelectorComponent } from './../../../../analysis-report-viewer/analysis-report-selector/analysis-report-selector.component';
import { KubernetesBaseTestModules, KubeBaseGuidMock } from '../../../../kubernetes.testing.module';
import { KubernetesAnalysisService } from '../../../../services/kubernetes.analysis.service';
import { KubernetesEndpointService } from '../../../../services/kubernetes-endpoint.service';
import { AnalysisReportViewerComponent } from '../../../../analysis-report-viewer/analysis-report-viewer.component';
import { HelmReleaseProviders } from '../../../../kubernetes.testing.module';
import { TabNavService } from 'frontend/packages/core/tab-nav.service';

describe('HelmReleaseAnalysisTabComponent', () => {
  let component: HelmReleaseAnalysisTabComponent;
  let fixture: ComponentFixture<HelmReleaseAnalysisTabComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HelmReleaseAnalysisTabComponent, AnalysisReportSelectorComponent, AnalysisReportViewerComponent],
      imports: [
        KubernetesBaseTestModules,
      ],
      providers: [
        KubernetesAnalysisService,
        KubernetesEndpointService,
        KubeBaseGuidMock,
        HelmReleaseProviders,
        TabNavService
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HelmReleaseAnalysisTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
