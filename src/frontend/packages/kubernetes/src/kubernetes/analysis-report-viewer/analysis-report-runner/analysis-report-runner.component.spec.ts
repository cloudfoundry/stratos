import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SharedModule } from '../../../../../core/src/public-api';
import { SidePanelService } from '../../../../../core/src/shared/services/side-panel.service';
import { KubeBaseGuidMock, KubernetesBaseTestModules } from '../../kubernetes.testing.module';
import { KubernetesEndpointService } from '../../services/kubernetes-endpoint.service';
import { KubernetesAnalysisService } from '../../services/kubernetes.analysis.service';
import { AnalysisReportRunnerComponent } from './analysis-report-runner.component';

describe('AnalysisReportRunnerComponent', () => {
  let component: AnalysisReportRunnerComponent;
  let fixture: ComponentFixture<AnalysisReportRunnerComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [AnalysisReportRunnerComponent],
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
