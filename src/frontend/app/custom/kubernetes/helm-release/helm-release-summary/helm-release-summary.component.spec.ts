import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HelmReleaseSummaryComponent } from './helm-release-summary.component';
import { HelmReleaseSummaryCardComponent } from './helm-release-summary-card/helm-release-summary-card.component';
import { BaseTestModules } from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { HelmReleaseService } from '../../services/helm-release.service';
import { KubernetesEndpointService } from '../../services/kubernetes-endpoint.service';
import { BaseKubeGuid } from '../../kubernetes-page.types';

describe('HelmReleaseSummaryComponent', () => {
  let component: HelmReleaseSummaryComponent;
  let fixture: ComponentFixture<HelmReleaseSummaryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [HelmReleaseSummaryComponent, HelmReleaseSummaryCardComponent],
      imports: BaseTestModules,
      providers: [BaseKubeGuid, HelmReleaseService, KubernetesEndpointService]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HelmReleaseSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
