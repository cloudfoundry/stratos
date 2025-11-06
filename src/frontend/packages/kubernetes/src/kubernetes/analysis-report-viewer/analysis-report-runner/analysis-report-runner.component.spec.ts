import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { SharedModule } from '../../../../../core/src/public-api';
import { SidePanelService } from '../../../../../core/src/shared/services/side-panel.service';
import { KubeBaseGuidMock, KubernetesBaseTestModules } from '../../kubernetes.testing.module';
import { KubernetesEndpointService } from '../../services/kubernetes-endpoint.service';
import { KubernetesAnalysisService } from '../../services/kubernetes.analysis.service';
import { AnalysisReportRunnerComponent } from './analysis-report-runner.component';

describe('AnalysisReportRunnerComponent', () => {
  let component: AnalysisReportRunnerComponent;
  let fixture: ComponentFixture<AnalysisReportRunnerComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({imports: [
        SharedModule,
        KubernetesBaseTestModules,
      ,
        AnalysisReportRunnerComponent
      ],
      providers: [
        
        KubernetesAnalysisService,
        KubernetesEndpointService,
        KubeBaseGuidMock,
        SidePanelService,
      ,
        provideZonelessChangeDetection()
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AnalysisReportRunnerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
