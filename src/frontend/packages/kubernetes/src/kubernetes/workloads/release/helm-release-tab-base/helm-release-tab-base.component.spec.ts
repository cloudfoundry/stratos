import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TabNavService } from '../../../../../../core/src/tab-nav.service';
import { HelmReleaseProviders, KubeBaseGuidMock, KubernetesBaseTestModules } from '../../../kubernetes.testing.module';
import { KubernetesEndpointService } from '../../../services/kubernetes-endpoint.service';
import { KubernetesAnalysisService } from '../../../services/kubernetes.analysis.service';
import { HelmReleaseTabBaseComponent } from './helm-release-tab-base.component';


describe('HelmReleaseTabBaseComponent', () => {
  let component: HelmReleaseTabBaseComponent;
  let fixture: ComponentFixture<HelmReleaseTabBaseComponent>;

  beforeEach(waitForAsync(() => {
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
