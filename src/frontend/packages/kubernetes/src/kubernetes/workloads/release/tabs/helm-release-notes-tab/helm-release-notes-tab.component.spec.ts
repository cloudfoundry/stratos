import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { HelmReleaseProviders, KubernetesBaseTestModules } from '../../../../kubernetes.testing.module';
import { HelmReleaseNotesTabComponent } from './helm-release-notes-tab.component';

describe('HelmReleaseNotesTabComponent', () => {
  let component: HelmReleaseNotesTabComponent;
  let fixture: ComponentFixture<HelmReleaseNotesTabComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        ...KubernetesBaseTestModules
      ],
      declarations: [
        HelmReleaseNotesTabComponent
      ],
      providers: [
        ...HelmReleaseProviders
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HelmReleaseNotesTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
