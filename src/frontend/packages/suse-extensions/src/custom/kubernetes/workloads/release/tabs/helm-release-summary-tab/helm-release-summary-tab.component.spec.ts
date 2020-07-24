import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { TabNavService } from 'frontend/packages/core/tab-nav.service';

import { HelmReleaseProviders, KubernetesBaseTestModules, KubeBaseGuidMock } from '../../../../kubernetes.testing.module';
import { HelmReleaseSummaryTabComponent } from './helm-release-summary-tab.component';
import { KubernetesAnalysisService } from '../../../../services/kubernetes.analysis.service';
import { KubernetesEndpointService } from '../../../../services/kubernetes-endpoint.service';
import { AnalysisReportSelectorComponent } from './../../../../analysis-report-viewer/analysis-report-selector/analysis-report-selector.component';
import { SidePanelService } from './../../../../../../shared/services/side-panel.service';

describe('HelmReleaseSummaryTabComponent', () => {
  let component: HelmReleaseSummaryTabComponent;
  let fixture: ComponentFixture<HelmReleaseSummaryTabComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        ...KubernetesBaseTestModules
      ],
      declarations: [HelmReleaseSummaryTabComponent, AnalysisReportSelectorComponent],
      providers: [
        ...HelmReleaseProviders,
        KubernetesAnalysisService,
        KubernetesEndpointService,
        KubeBaseGuidMock,
        TabNavService,
        SidePanelService
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HelmReleaseSummaryTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
