import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HelmBaseTestModules, HelmBaseTestProviders } from '../../../helm-testing.module';
import { HelmReleaseValuesTabComponent } from './helm-release-values-tab.component';

describe('HelmReleaseValuesTabComponent', () => {
  let component: HelmReleaseValuesTabComponent;
  let fixture: ComponentFixture<HelmReleaseValuesTabComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        ...HelmBaseTestModules
      ],
      declarations: [
        HelmReleaseValuesTabComponent
      ],
      providers: [
        ...HelmBaseTestProviders
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
