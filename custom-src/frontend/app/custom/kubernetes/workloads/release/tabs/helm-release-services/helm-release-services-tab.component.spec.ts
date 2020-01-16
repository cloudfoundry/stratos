import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HelmBaseTestModules, HelmBaseTestProviders } from '../../../helm-testing.module';
import { HelmReleaseServicesTabComponent } from './helm-release-services-tab.component';


describe('HelmReleaseServicesTabComponent', () => {
  let component: HelmReleaseServicesTabComponent;
  let fixture: ComponentFixture<HelmReleaseServicesTabComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        ...HelmBaseTestModules
      ],
      declarations: [HelmReleaseServicesTabComponent],
      providers: [
        ...HelmBaseTestProviders
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HelmReleaseServicesTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
