import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HelmBaseTestModules, HelmBaseTestProviders } from '../../../helm-testing.module';
import { HelmReleaseSummaryTabComponent } from './helm-release-summary-tab.component';

describe('HelmReleaseSummaryTabComponent', () => {
  let component: HelmReleaseSummaryTabComponent;
  let fixture: ComponentFixture<HelmReleaseSummaryTabComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        ...HelmBaseTestModules
      ],
      declarations: [HelmReleaseSummaryTabComponent],
      providers: [
        ...HelmBaseTestProviders
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HelmReleaseSummaryTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
