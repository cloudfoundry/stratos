import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HelmReleaseGuidMock } from '../../../../../helm/helm-testing.module';
import { HelmReleaseHelperService } from '../helm-release-helper.service';
import { HelmReleaseHistoryTabComponent } from './helm-release-history-tab.component';

describe('HelmReleaseHistoryTabComponent', () => {
  let component: HelmReleaseHistoryTabComponent;
  let fixture: ComponentFixture<HelmReleaseHistoryTabComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HelmReleaseHistoryTabComponent ],
      providers: [
        HelmReleaseHelperService,
        HelmReleaseGuidMock
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HelmReleaseHistoryTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
