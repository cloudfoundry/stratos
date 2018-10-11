import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HelmReleasePodNameLinkComponent } from './helm-release-pod-name-link.component';

describe('HelmReleasePodNameLinkComponent', () => {
  let component: HelmReleasePodNameLinkComponent<any>;
  let fixture: ComponentFixture<HelmReleasePodNameLinkComponent<any>>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [HelmReleasePodNameLinkComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HelmReleasePodNameLinkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
