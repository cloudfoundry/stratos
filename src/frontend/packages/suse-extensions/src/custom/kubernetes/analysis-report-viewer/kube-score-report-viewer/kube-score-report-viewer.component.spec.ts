import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MDAppModule } from './../../../../core/md.module';

import { KubeScoreReportViewerComponent } from './kube-score-report-viewer.component';
import { KubernetesBaseTestModules, KubeBaseGuidMock } from '../../kubernetes.testing.module';
import { KubernetesAnalysisService } from '../../services/kubernetes.analysis.service';
import { KubernetesEndpointService } from '../../services/kubernetes-endpoint.service';

describe('KubeScoreReportViewerComponent', () => {
  let component: KubeScoreReportViewerComponent;
  let fixture: ComponentFixture<KubeScoreReportViewerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KubeScoreReportViewerComponent ],
      imports: [
        KubernetesBaseTestModules,
        MDAppModule
      ],
      providers: [
        KubernetesAnalysisService,
        KubernetesEndpointService,
        KubeBaseGuidMock,
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubeScoreReportViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
