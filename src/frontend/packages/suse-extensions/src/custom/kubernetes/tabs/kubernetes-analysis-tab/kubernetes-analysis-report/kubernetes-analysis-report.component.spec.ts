
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KubernetesAnalysisReportComponent } from './kubernetes-analysis-report.component';
import { KubernetesBaseTestModules } from '../../../kubernetes.testing.module';
import { AnalysisReportViewerComponent } from './../../../analysis-report-viewer/analysis-report-viewer.component';

describe('KubernetesAnalysisReportComponent', () => {
  let component: KubernetesAnalysisReportComponent;
  let fixture: ComponentFixture<KubernetesAnalysisReportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KubernetesAnalysisReportComponent, AnalysisReportViewerComponent ],
      imports: [
        KubernetesBaseTestModules,
//        MDAppModule
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesAnalysisReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
