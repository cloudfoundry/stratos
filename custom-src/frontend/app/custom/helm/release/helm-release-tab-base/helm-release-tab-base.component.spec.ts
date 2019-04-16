import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TabNavService } from '../../../../../tab-nav.service';
import { HelmBaseTestModules, HelmBaseTestProviders } from '../../helm-testing.module';
import { HelmReleaseTabBaseComponent } from './helm-release-tab-base.component';


describe('HelmReleaseTabBaseComponent', () => {
  let component: HelmReleaseTabBaseComponent;
  let fixture: ComponentFixture<HelmReleaseTabBaseComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [...HelmBaseTestModules],
      declarations: [HelmReleaseTabBaseComponent],
      providers: [
        ...HelmBaseTestProviders,
        TabNavService
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HelmReleaseTabBaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
