import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HelmBaseTestModules, HelmBaseTestProviders } from '../../../helm-testing.module';
import { HelmReleasePodsTabComponent } from './helm-release-pods-tab.component';

describe('HelmReleasePodsTabComponent', () => {
  let component: HelmReleasePodsTabComponent;
  let fixture: ComponentFixture<HelmReleasePodsTabComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        ...HelmBaseTestModules
      ],
      declarations: [HelmReleasePodsTabComponent],
      providers: [
        ...HelmBaseTestProviders
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
