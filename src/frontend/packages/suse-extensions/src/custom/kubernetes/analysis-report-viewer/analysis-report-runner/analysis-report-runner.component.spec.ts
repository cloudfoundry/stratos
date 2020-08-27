import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KubeBaseGuidMock, KubernetesBaseTestModules } from '../../kubernetes.testing.module';
import { KubernetesEndpointService } from '../../services/kubernetes-endpoint.service';
import { KubernetesAnalysisService } from '../../services/kubernetes.analysis.service';
import { SidePanelService } from './../../../../../../core/src/shared/services/side-panel.service';
import { SharedModule } from './../../../../../../core/src/shared/shared.module';
import { AnalysisReportRunnerComponent } from './analysis-report-runner.component';

describe('AnalysisReportRunnerComponent', () => {
  let component: AnalysisReportRunnerComponent;
  let fixture: ComponentFixture<AnalysisReportRunnerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AnalysisReportRunnerComponent ],
      imports: [
        SharedModule,
        KubernetesBaseTestModules,
      ],
      providers: [
        KubernetesAnalysisService,
        KubernetesEndpointService,
        KubeBaseGuidMock,
        SidePanelService,
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AnalysisReportRunnerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
