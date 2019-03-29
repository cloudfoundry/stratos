import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HelmReleasePodsTabComponent } from './helm-release-pods-tab.component';

describe('HelmReleaseValuesTabComponent', () => {
  let component: HelmReleasePodsTabComponent;
  let fixture: ComponentFixture<HelmReleasePodsTabComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [HelmReleasePodsTabComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HelmReleasePodsTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
