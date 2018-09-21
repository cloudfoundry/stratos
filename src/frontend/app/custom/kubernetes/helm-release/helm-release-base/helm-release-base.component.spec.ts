import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HelmReleaseBaseComponent } from './helm-release-base.component';

describe('HelmReleaseBaseComponent', () => {
  let component: HelmReleaseBaseComponent;
  let fixture: ComponentFixture<HelmReleaseBaseComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HelmReleaseBaseComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HelmReleaseBaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
