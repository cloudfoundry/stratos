import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { ActivatedRoute } from '@angular/router';

import { KubernetesBaseTestModules } from '../kubernetes.testing.module';
import { KubernetesAnalysisService } from '../services/kubernetes.analysis.service';
import { AnalysisReportViewerComponent } from './analysis-report-viewer.component';

describe('AnalysisReportViewerComponent', () => {
  let component: AnalysisReportViewerComponent;
  let fixture: ComponentFixture<AnalysisReportViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        KubernetesBaseTestModules,

        AnalysisReportViewerComponent,
      ],
      providers: [

        KubernetesAnalysisService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: { endpointId: 'test' },
              queryParams: {}
            }
          }
        },

        provideZonelessChangeDetection(),
      ]
    }).compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(AnalysisReportViewerComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows the viewer for the report format, and keeps it for the same report', async () => {
    const host: HTMLElement = fixture.nativeElement;
    const report = { id: 'r1', format: 'kubescore', report: {} };
    expect(host.querySelector('app-kube-score-report-viewer')).toBeNull();

    fixture.componentRef.setInput('report', report);
    await fixture.whenStable();
    const viewer = host.querySelector('app-kube-score-report-viewer');
    expect(viewer).not.toBeNull();

    // Same id: the viewer is not rebuilt.
    fixture.componentRef.setInput('report', { ...report });
    await fixture.whenStable();
    expect(host.querySelector('app-kube-score-report-viewer')).toBe(viewer);

    fixture.componentRef.setInput('report', { id: 'r2', format: 'popeye', report: {} });
    await fixture.whenStable();
    expect(host.querySelector('app-kube-score-report-viewer')).toBeNull();
    expect(host.querySelector('app-popeye-report-viewer')).not.toBeNull();
  });
});
