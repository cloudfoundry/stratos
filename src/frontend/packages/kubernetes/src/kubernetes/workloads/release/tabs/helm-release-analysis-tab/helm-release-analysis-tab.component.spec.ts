import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TabNavService } from '../../../../../../../core/src/tab-nav.service';
import { AnalysisReportViewerComponent } from '../../../../analysis-report-viewer/analysis-report-viewer.component';
import { HelmReleaseProviders, KubeBaseGuidMock, KubernetesBaseTestModules } from '../../../../kubernetes.testing.module';
import { KubernetesEndpointService } from '../../../../services/kubernetes-endpoint.service';
import { KubernetesAnalysisService } from '../../../../services/kubernetes.analysis.service';
import {
  AnalysisReportSelectorComponent,
} from './../../../../analysis-report-viewer/analysis-report-selector/analysis-report-selector.component';
import { HelmReleaseAnalysisTabComponent } from './helm-release-analysis-tab.component';

describe('HelmReleaseAnalysisTabComponent', () => {
  let component: HelmReleaseAnalysisTabComponent;
  let fixture: ComponentFixture<HelmReleaseAnalysisTabComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [HelmReleaseAnalysisTabComponent, AnalysisReportSelectorComponent, AnalysisReportViewerComponent],
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
