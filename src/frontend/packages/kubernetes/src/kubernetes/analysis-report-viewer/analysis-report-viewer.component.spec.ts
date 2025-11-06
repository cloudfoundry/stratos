import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { KubernetesBaseTestModules } from '../kubernetes.testing.module';
import { KubernetesAnalysisService } from '../services/kubernetes.analysis.service';
import { AnalysisReportViewerComponent } from './analysis-report-viewer.component';

describe('AnalysisReportViewerComponent', () => {
  let component: AnalysisReportViewerComponent;
  let fixture: ComponentFixture<AnalysisReportViewerComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ AnalysisReportViewerComponent ],
      imports: [
        KubernetesBaseTestModules,
      ],
      providers: [
        KubernetesAnalysisService
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AnalysisReportViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
