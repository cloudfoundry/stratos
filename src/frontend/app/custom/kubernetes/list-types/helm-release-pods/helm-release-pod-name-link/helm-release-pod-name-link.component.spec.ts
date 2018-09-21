import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HelmReleasePodNameLinkComponent } from './helm-release-pod-name-link.component';

describe('HelmReleasePodNameLinkComponent', () => {
  let component: HelmReleasePodNameLinkComponent;
  let fixture: ComponentFixture<HelmReleasePodNameLinkComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HelmReleasePodNameLinkComponent ]
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
