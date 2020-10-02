import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HelmReleaseGuidMock } from '../../../../helm/helm-testing.module';
import { KubernetesBaseTestModules } from '../../../kubernetes.testing.module';
import { HelmReleaseSocketService } from '../helm-release-tab-base/helm-release-socket-service';
import { HelmReleaseHelperService } from '../tabs/helm-release-helper.service';
import { WorkloadLiveReloadComponent } from './workload-live-reload.component';

describe('WorkloadLiveReloadComponent', () => {
  let component: WorkloadLiveReloadComponent;
  let fixture: ComponentFixture<WorkloadLiveReloadComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        ...KubernetesBaseTestModules
      ],
      declarations: [WorkloadLiveReloadComponent],
      providers: [
        HelmReleaseSocketService,
        HelmReleaseHelperService,
        HelmReleaseGuidMock
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkloadLiveReloadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
