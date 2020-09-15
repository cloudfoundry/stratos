import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NgxGraphModule } from '@swimlane/ngx-graph';
import { SidePanelService } from 'frontend/packages/core/src/shared/services/side-panel.service';
import { TabNavService } from 'frontend/packages/core/src/tab-nav.service';

import { HelmReleaseProviders, KubernetesBaseTestModules } from '../../../../kubernetes.testing.module';
import { KubernetesEndpointService } from '../../../../services/kubernetes-endpoint.service';
import { KubernetesAnalysisService } from '../../../../services/kubernetes.analysis.service';
import {
  AnalysisReportSelectorComponent,
} from './../../../../analysis-report-viewer/analysis-report-selector/analysis-report-selector.component';
import { KubeBaseGuidMock } from './../../../../kubernetes.testing.module';
import { HelmReleaseResourceGraphComponent } from './helm-release-resource-graph.component';

describe('HelmReleaseResourceGraphComponent', () => {
  let component: HelmReleaseResourceGraphComponent;
  let fixture: ComponentFixture<HelmReleaseResourceGraphComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        ...KubernetesBaseTestModules,
        NgxGraphModule
      ],
      declarations: [HelmReleaseResourceGraphComponent, AnalysisReportSelectorComponent],
      providers: [
        ...HelmReleaseProviders,
        SidePanelService,
        TabNavService,
        KubernetesAnalysisService,
        KubernetesEndpointService,
        KubeBaseGuidMock,
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HelmReleaseResourceGraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
