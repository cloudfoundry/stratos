import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedModule } from '../../../../../../core/src/public-api';
import { SidePanelService } from '../../../../../../core/src/shared/services/side-panel.service';
import { KubeBaseGuidMock, KubernetesBaseTestModules } from '../../../kubernetes.testing.module';
import { KubernetesEndpointService } from '../../../services/kubernetes-endpoint.service';
import { KubernetesAnalysisService } from '../../../services/kubernetes.analysis.service';
import { AnalysisInfoCardComponent } from './analysis-info-card/analysis-info-card.component';
import { KubernetesAnalysisInfoComponent } from './kubernetes-analysis-info.component';


describe('KubernetesAnalysisInfoComponent', () => {
  let component: KubernetesAnalysisInfoComponent;
  let fixture: ComponentFixture<KubernetesAnalysisInfoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [KubernetesAnalysisInfoComponent, AnalysisInfoCardComponent],
      imports: [
        SharedModule,
        KubernetesBaseTestModules,
      ],
      providers: [
        KubernetesAnalysisService,
        KubernetesEndpointService,
        SidePanelService,
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
