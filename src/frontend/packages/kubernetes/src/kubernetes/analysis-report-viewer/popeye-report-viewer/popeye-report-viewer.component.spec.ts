import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { KubernetesBaseTestModules } from '../../kubernetes.testing.module';
import { KubernetesAnalysisService } from '../../services/kubernetes.analysis.service';
import type { AnalysisReport } from '../../store/kube.types';
import { PopeyeReportViewerComponent } from './popeye-report-viewer.component';

describe('PopeyeReportViewerComponent', () => {
  let component: PopeyeReportViewerComponent;
  let fixture: ComponentFixture<PopeyeReportViewerComponent>;

  const mockAnalysisReport: AnalysisReport = {
    id: 'test-report-1',
    endpoint: 'test-endpoint',
    type: 'popeye',
    name: 'Test Popeye Report',
    path: '/test/path',
    created: new Date('2025-11-13'),
    read: false,
    status: 'completed',
    duration: 1000,
    report: {
      popeye: {
        score: 85,
        grade: 'A',
        sanitizers: [
          {
            sanitizer: 'pods',
            tally: {
              ok: 10,
              info: 2,
              warning: 1,
              error: 0,
              score: 90
            },
            issues: {
              'test-namespace/test-pod': [
                { message: 'Test issue message', level: 1 }
              ]
            }
          }
        ]
      }
    }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        KubernetesBaseTestModules,
        PopeyeReportViewerComponent,
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

  beforeEach(() => {
    fixture = TestBed.createComponent(PopeyeReportViewerComponent);
    component = fixture.componentInstance;
    // Set the report property before detectChanges triggers ngOnInit
    component.report = mockAnalysisReport;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
