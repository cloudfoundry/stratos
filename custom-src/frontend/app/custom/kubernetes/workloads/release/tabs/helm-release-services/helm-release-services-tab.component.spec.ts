import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HelmReleaseProviders, KubernetesBaseTestModules } from '../../../../kubernetes.testing.module';
import { HelmReleaseServicesTabComponent } from './helm-release-services-tab.component';


describe('HelmReleaseServicesTabComponent', () => {
  let component: HelmReleaseServicesTabComponent;
  let fixture: ComponentFixture<HelmReleaseServicesTabComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        ...KubernetesBaseTestModules
      ],
      declarations: [HelmReleaseServicesTabComponent],
      providers: [
        ...HelmReleaseProviders
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
