import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HelmReleaseSummaryComponent } from './helm-release-summary.component';

describe('HelmReleaseSummaryComponent', () => {
  let component: HelmReleaseSummaryComponent;
  let fixture: ComponentFixture<HelmReleaseSummaryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HelmReleaseSummaryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HelmReleaseSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
