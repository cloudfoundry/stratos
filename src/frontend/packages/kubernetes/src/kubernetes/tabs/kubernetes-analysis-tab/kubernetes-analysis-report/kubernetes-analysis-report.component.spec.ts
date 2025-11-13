import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';

import { KubeBaseGuidMock, KubernetesBaseTestModules } from '../../../kubernetes.testing.module';
import { KubernetesAnalysisService } from '../../../services/kubernetes.analysis.service';
import { KubernetesAnalysisReportComponent } from './kubernetes-analysis-report.component';

describe('KubernetesAnalysisReportComponent', () => {
  let component: KubernetesAnalysisReportComponent;
  let fixture: ComponentFixture<KubernetesAnalysisReportComponent>;
  let mockAnalysisService: any;

  beforeEach(async () => {
    // Create mock analysis service with getByID method that returns mock data
    mockAnalysisService = {
      getByID: vi.fn().mockReturnValue(of({
        id: 'test-id',
        name: 'Test Analysis Report',
        type: 'popeye',
        report: { sections: [] },
        created: new Date().toISOString()
      }))
    };

    await TestBed.configureTestingModule({
      imports: [
        KubernetesAnalysisReportComponent,
        ...KubernetesBaseTestModules,
      ],
      providers: [
        provideRouter([]),
        KubeBaseGuidMock,
        { provide: KubernetesAnalysisService, useValue: mockAnalysisService },
        provideZonelessChangeDetection(),
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesAnalysisReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
