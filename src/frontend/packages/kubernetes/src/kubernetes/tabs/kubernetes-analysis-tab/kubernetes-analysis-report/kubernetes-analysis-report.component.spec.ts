import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { KubeAnalysisDataService } from '../../../../services/domain-data/kube-analysis-data.service';
import { KubeBaseGuidMock, KubernetesBaseTestModules } from '../../../kubernetes.testing.module';
import { KubernetesAnalysisReportComponent } from './kubernetes-analysis-report.component';

describe('KubernetesAnalysisReportComponent', () => {
  let component: KubernetesAnalysisReportComponent;
  let fixture: ComponentFixture<KubernetesAnalysisReportComponent>;
  let mockAnalysisData: { reportById: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockAnalysisData = {
      reportById: vi.fn().mockReturnValue(of({
        id: 'test-id',
        name: 'Test Analysis Report',
        type: 'popeye',
        report: { sections: [] },
        created: new Date().toISOString(),
      })),
    };

    await TestBed.configureTestingModule({
      imports: [
        KubernetesAnalysisReportComponent,
        ...KubernetesBaseTestModules,
      ],
      providers: [
        provideRouter([]),
        KubeBaseGuidMock,
        { provide: KubeAnalysisDataService, useValue: mockAnalysisData },
        provideZonelessChangeDetection(),
      ],
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
