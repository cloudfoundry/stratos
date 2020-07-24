import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { TabNavService } from 'frontend/packages/core/tab-nav.service';

import { HelmReleaseProviders, KubernetesBaseTestModules, KubeBaseGuidMock } from '../../../kubernetes.testing.module';
import { HelmReleaseTabBaseComponent } from './helm-release-tab-base.component';
import { KubernetesAnalysisService } from '../../../services/kubernetes.analysis.service';
import { KubernetesEndpointService } from '../../../services/kubernetes-endpoint.service';


describe('HelmReleaseTabBaseComponent', () => {
  let component: HelmReleaseTabBaseComponent;
  let fixture: ComponentFixture<HelmReleaseTabBaseComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [...KubernetesBaseTestModules],
      declarations: [HelmReleaseTabBaseComponent],
      providers: [
        ...HelmReleaseProviders,
        TabNavService,
        KubernetesAnalysisService,
        KubernetesEndpointService,
        KubeBaseGuidMock,
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HelmReleaseTabBaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
