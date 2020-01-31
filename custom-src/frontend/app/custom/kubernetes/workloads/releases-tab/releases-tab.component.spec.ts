import { DatePipe } from '@angular/common';
import { async, TestBed } from '@angular/core/testing';
import { TabNavService } from 'frontend/packages/core/tab-nav.service';

import { KubernetesBaseTestModules } from '../../kubernetes.testing.module';
import { HelmReleaseHelperService } from '../release/tabs/helm-release-helper.service';
import { HelmReleasesTabComponent } from './releases-tab.component';

describe('ReleasesTabComponent', () => {
  let component: HelmReleasesTabComponent;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        ...KubernetesBaseTestModules
      ],
      declarations: [HelmReleasesTabComponent],
      providers: [
        DatePipe,
        HelmReleaseHelperService,
        TabNavService
      ]

    })
      .compileComponents();
  }));

  beforeEach(() => {
    const fixture = TestBed.createComponent(HelmReleasesTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
