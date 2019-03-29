import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HelmReleaseServicesTabComponent } from './helm-release-services-tab.component';


describe('HelmReleaseValuesTabComponent', () => {
  let component: HelmReleaseServicesTabComponent;
  let fixture: ComponentFixture<HelmReleaseServicesTabComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [HelmReleaseServicesTabComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HelmReleaseServicesTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
