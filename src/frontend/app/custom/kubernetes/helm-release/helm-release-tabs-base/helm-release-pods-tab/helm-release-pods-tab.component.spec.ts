import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HelmReleasePodsComponent } from './helm-release-pods.component';

describe('HelmReleasePodsComponent', () => {
  let component: HelmReleasePodsComponent;
  let fixture: ComponentFixture<HelmReleasePodsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HelmReleasePodsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HelmReleasePodsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
