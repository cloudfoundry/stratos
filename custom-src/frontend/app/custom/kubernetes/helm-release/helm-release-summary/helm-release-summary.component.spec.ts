import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HelmReleaseSummaryComponent } from './helm-release-summary.component';
import { HelmReleaseSummaryCardComponent } from './helm-release-summary-card/helm-release-summary-card.component';
import { HelmReleaseService } from '../../services/helm-release.service';
import { KubernetesEndpointService } from '../../services/kubernetes-endpoint.service';
import { BaseKubeGuid } from '../../kubernetes-page.types';
import { KubernetesBaseTestModules } from '../../kubernetes.testing.module';

describe('HelmReleaseSummaryComponent', () => {
  let component: HelmReleaseSummaryComponent;
  let fixture: ComponentFixture<HelmReleaseSummaryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [HelmReleaseSummaryComponent, HelmReleaseSummaryCardComponent],
      imports: KubernetesBaseTestModules,
      providers: [BaseKubeGuid, HelmReleaseService, KubernetesEndpointService]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HelmReleaseSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
