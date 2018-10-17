import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HelmReleaseServicesComponent } from './helm-release-services.component';
import { BaseTestModulesNoShared, BaseTestModules } from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { BaseKubeGuid } from '../../kubernetes-page.types';
import { HelmReleaseService } from '../../services/helm-release.service';
import { KubernetesEndpointService } from '../../services/kubernetes-endpoint.service';

describe('HelmReleaseServicesComponent', () => {
  let component: HelmReleaseServicesComponent;
  let fixture: ComponentFixture<HelmReleaseServicesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [HelmReleaseServicesComponent],
      imports: BaseTestModules,
      providers: [BaseKubeGuid, HelmReleaseService, KubernetesEndpointService]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HelmReleaseServicesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
