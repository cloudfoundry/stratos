
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KubernetesAnalysisInfoComponent } from './kubernetes-analysis-info.component';
import { AnalysisInfoCardComponent } from './analysis-info-card/analysis-info-card.component';
import { KubernetesBaseTestModules, KubeBaseGuidMock } from '../../../kubernetes.testing.module';
import { KubernetesAnalysisService } from '../../../services/kubernetes.analysis.service';
import { KubernetesEndpointService } from '../../../services/kubernetes-endpoint.service';

describe('KubernetesAnalysisInfoComponent', () => {
  let component: KubernetesAnalysisInfoComponent;
  let fixture: ComponentFixture<KubernetesAnalysisInfoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KubernetesAnalysisInfoComponent, AnalysisInfoCardComponent ],
      imports: [
        KubernetesBaseTestModules,
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
    fixture = TestBed.createComponent(KubernetesAnalysisInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
