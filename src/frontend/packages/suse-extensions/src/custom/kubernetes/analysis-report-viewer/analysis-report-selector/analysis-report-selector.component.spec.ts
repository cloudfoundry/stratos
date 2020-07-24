import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MDAppModule } from './../../../../core/md.module';

import { AnalysisReportSelectorComponent } from './analysis-report-selector.component';
import { KubernetesAnalysisService } from '../../services/kubernetes.analysis.service';
import { KubernetesEndpointService } from '../../services/kubernetes-endpoint.service';
import { KubeBaseGuidMock, KubernetesBaseTestModules } from '../../kubernetes.testing.module';

describe('AnalysisReportSelectorComponent', () => {
  let component: AnalysisReportSelectorComponent;
  let fixture: ComponentFixture<AnalysisReportSelectorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AnalysisReportSelectorComponent ],
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
    fixture = TestBed.createComponent(AnalysisReportSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
