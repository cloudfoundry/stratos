import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AnalysisReportViewerComponent } from './analysis-report-viewer.component';
import { KubernetesBaseTestModules } from '../kubernetes.testing.module';

describe('AnalysisReportViewerComponent', () => {
  let component: AnalysisReportViewerComponent;
  let fixture: ComponentFixture<AnalysisReportViewerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AnalysisReportViewerComponent ],
      imports: [
        KubernetesBaseTestModules,
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AnalysisReportViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
