
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MDAppModule } from './../../../../core/md.module';

import { KubernetesAnalysisTabComponent } from './kubernetes-analysis-tab.component';
import { KubernetesBaseTestModules, KubeBaseGuidMock } from '../../kubernetes.testing.module';
import { KubernetesAnalysisService } from '../../services/kubernetes.analysis.service';
import { KubernetesEndpointService } from '../../services/kubernetes-endpoint.service';
import { AnalysisReportViewerComponent } from './../../analysis-report-viewer/analysis-report-viewer.component';
import { TabNavService } from 'frontend/packages/core/tab-nav.service';

describe('KubernetesAnalysisTabComponent', () => {
  let component: KubernetesAnalysisTabComponent;
  let fixture: ComponentFixture<KubernetesAnalysisTabComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KubernetesAnalysisTabComponent, AnalysisReportViewerComponent ],
      imports: [
        KubernetesBaseTestModules,
        MDAppModule
      ],
      providers: [
        KubernetesAnalysisService,
        KubernetesEndpointService,
        KubeBaseGuidMock,
        TabNavService,
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesAnalysisTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
