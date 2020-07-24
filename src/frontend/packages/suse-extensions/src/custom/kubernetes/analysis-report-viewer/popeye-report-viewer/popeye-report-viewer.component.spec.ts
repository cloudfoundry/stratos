import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MDAppModule } from './../../../../core/md.module';

import { PopeyeReportViewerComponent } from './popeye-report-viewer.component';
import { KubernetesBaseTestModules, KubeBaseGuidMock } from '../../kubernetes.testing.module';
import { KubernetesAnalysisService } from '../../services/kubernetes.analysis.service';
import { KubernetesEndpointService } from '../../services/kubernetes-endpoint.service';

describe('PopeyeReportViewerComponent', () => {
  let component: PopeyeReportViewerComponent;
  let fixture: ComponentFixture<PopeyeReportViewerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PopeyeReportViewerComponent ],
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
    fixture = TestBed.createComponent(PopeyeReportViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
