import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HelmReleaseSummaryCardComponent } from './helm-release-summary-card.component';
import { HelmReleaseService } from '../../../services/helm-release.service';
import { BaseKubeGuid } from '../../../kubernetes-page.types';
import { KubernetesEndpointService } from '../../../services/kubernetes-endpoint.service';
import { KubernetesBaseTestModules } from '../../../kubernetes.testing.module';

describe('HelmReleaseSummaryCardComponent', () => {
  let component: HelmReleaseSummaryCardComponent;
  let fixture: ComponentFixture<HelmReleaseSummaryCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [HelmReleaseSummaryCardComponent],
      imports: KubernetesBaseTestModules,
      providers: [BaseKubeGuid, HelmReleaseService, KubernetesEndpointService]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HelmReleaseSummaryCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
