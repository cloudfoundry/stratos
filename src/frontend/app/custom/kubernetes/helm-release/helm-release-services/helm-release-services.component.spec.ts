import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HelmReleaseServicesComponent } from './helm-release-services.component';

describe('HelmReleaseServicesComponent', () => {
  let component: HelmReleaseServicesComponent;
  let fixture: ComponentFixture<HelmReleaseServicesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HelmReleaseServicesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HelmReleaseServicesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
