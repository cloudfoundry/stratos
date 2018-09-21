import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HelmReleasePodComponent } from './helm-release-pod.component';

describe('HelmReleasePodComponent', () => {
  let component: HelmReleasePodComponent;
  let fixture: ComponentFixture<HelmReleasePodComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HelmReleasePodComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HelmReleasePodComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
