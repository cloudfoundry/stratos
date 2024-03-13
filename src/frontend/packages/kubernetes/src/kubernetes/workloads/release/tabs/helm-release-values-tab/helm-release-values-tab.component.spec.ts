import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TabNavService } from '../../../../../../../core/src/tab-nav.service';
import { HelmReleaseProviders, KubernetesBaseTestModules } from '../../../../kubernetes.testing.module';
import { HelmReleaseValuesTabComponent } from './helm-release-values-tab.component';

describe('HelmReleaseValuesTabComponent', () => {
  let component: HelmReleaseValuesTabComponent;
  let fixture: ComponentFixture<HelmReleaseValuesTabComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        ...KubernetesBaseTestModules
      ],
      declarations: [
        HelmReleaseValuesTabComponent
      ],
      providers: [
        // ...HelmBaseTestProviders,
        ...HelmReleaseProviders,
        TabNavService
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HelmReleaseValuesTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
