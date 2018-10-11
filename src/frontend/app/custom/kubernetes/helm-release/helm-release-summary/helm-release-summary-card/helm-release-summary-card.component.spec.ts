import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HelmReleaseSummaryCardComponent } from './helm-release-summary-card.component';

describe('HelmReleaseSummaryCardComponent', () => {
  let component: HelmReleaseSummaryCardComponent;
  let fixture: ComponentFixture<HelmReleaseSummaryCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HelmReleaseSummaryCardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HelmReleaseSummaryCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
