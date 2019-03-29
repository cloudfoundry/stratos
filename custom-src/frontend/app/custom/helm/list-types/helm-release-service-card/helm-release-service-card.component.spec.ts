import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HelmReleaseServiceCardComponent } from './helm-release-service-card.component';


describe('HelmReleaseServiceCardComponent', () => {
  let component: HelmReleaseServiceCardComponent;
  let fixture: ComponentFixture<HelmReleaseServiceCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [HelmReleaseServiceCardComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HelmReleaseServiceCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
