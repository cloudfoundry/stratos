import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HelmReleaseTabsBaseComponent } from './helm-release-tabs-base.component';

describe('HelmReleaseTabsBaseComponent', () => {
  let component: HelmReleaseTabsBaseComponent;
  let fixture: ComponentFixture<HelmReleaseTabsBaseComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HelmReleaseTabsBaseComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HelmReleaseTabsBaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
