import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { TabNavService } from 'frontend/packages/core/src/tab-nav.service';

import { SidePanelService } from '../../../../../../../../core/src/shared/services/side-panel.service';
import { HelmReleaseProviders, KubeBaseGuidMock } from '../../../../kubernetes.testing.module';
import { KubernetesEndpointService } from '../../../../services/kubernetes-endpoint.service';
import { KubernetesAnalysisService } from '../../../../services/kubernetes.analysis.service';
import { WorkloadsBaseTestingModule } from '../../../workloads.testing.module';
import {
  AnalysisReportSelectorComponent,
} from './../../../../analysis-report-viewer/analysis-report-selector/analysis-report-selector.component';
import { HelmReleaseSummaryTabComponent } from './helm-release-summary-tab.component';

describe('HelmReleaseSummaryTabComponent', () => {
  let component: HelmReleaseSummaryTabComponent;
  let fixture: ComponentFixture<HelmReleaseSummaryTabComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        ...WorkloadsBaseTestingModule
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
