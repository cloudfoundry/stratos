import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HelmReleaseGuidMock } from '../../../../../helm/helm-testing.module';
import { HelmReleaseProviders, KubernetesBaseTestModules } from '../../../../kubernetes.testing.module';
import { HelmReleaseSocketService } from '../../helm-release-tab-base/helm-release-socket-service';
import { WorkloadLiveReloadComponent } from '../../workload-live-reload/workload-live-reload.component';
import { HelmReleaseHelperService } from '../helm-release-helper.service';
import { HelmReleasePodsTabComponent } from './helm-release-pods-tab.component';

describe('HelmReleasePodsTabComponent', () => {
  let component: HelmReleasePodsTabComponent;
  let fixture: ComponentFixture<HelmReleasePodsTabComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        ...KubernetesBaseTestModules
      ],
      declarations: [
        HelmReleasePodsTabComponent,
        WorkloadLiveReloadComponent
      ],
      providers: [
        ...HelmReleaseProviders,
        HelmReleaseSocketService,
        HelmReleaseHelperService,
        HelmReleaseGuidMock
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HelmReleasePodsTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
