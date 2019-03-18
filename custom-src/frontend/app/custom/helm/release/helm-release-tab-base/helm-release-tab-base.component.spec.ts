import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HelmReleaseTabBaseComponent } from './helm-release-tab-base.component';

describe('HelmReleaseTabBaseComponent', () => {
  let component: HelmReleaseTabBaseComponent;
  let fixture: ComponentFixture<HelmReleaseTabBaseComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HelmReleaseTabBaseComponent ]
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
