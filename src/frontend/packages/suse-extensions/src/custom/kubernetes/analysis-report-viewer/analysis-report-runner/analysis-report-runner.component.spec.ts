import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AnalysisReportRunnerComponent } from './analysis-report-runner.component';

describe('AnalysisReportRunnerComponent', () => {
  let component: AnalysisReportRunnerComponent;
  let fixture: ComponentFixture<AnalysisReportRunnerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AnalysisReportRunnerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AnalysisReportRunnerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
