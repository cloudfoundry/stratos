import { HelmBaseTestModules } from '../../../helm/helm-testing.module';
import { DatePipe } from './@angular/common';
import { async, ComponentFixture, TestBed } from './@angular/core/testing';
import { HelmReleasesTabComponent } from './releases-tab.component';

describe('ReleasesTabComponent', () => {
  let component: HelmReleasesTabComponent;
  let fixture: ComponentFixture<HelmReleasesTabComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        ...HelmBaseTestModules
      ],
      declarations: [HelmReleasesTabComponent],
      providers: [DatePipe]

    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HelmReleasesTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
