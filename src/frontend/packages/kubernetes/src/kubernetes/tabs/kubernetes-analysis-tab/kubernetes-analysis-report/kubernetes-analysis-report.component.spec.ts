import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { EntityServiceFactory } from '../../../../../../store/src/entity-service-factory.service';
import { TabNavService } from '../../../../../../core/src/tab-nav.service';
import { KubeBaseGuidMock, KubernetesBaseTestModules } from '../../../kubernetes.testing.module';
import { KubernetesEndpointService } from '../../../services/kubernetes-endpoint.service';
import { KubernetesAnalysisService } from '../../../services/kubernetes.analysis.service';
import { CoreModule } from './../../../../../../core/src/core/core.module';
import { AnalysisReportViewerComponent } from './../../../analysis-report-viewer/analysis-report-viewer.component';
import { KubernetesAnalysisReportComponent } from './kubernetes-analysis-report.component';


describe('KubernetesAnalysisReportComponent', () => {
  let component: KubernetesAnalysisReportComponent;
  let fixture: ComponentFixture<KubernetesAnalysisReportComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({imports: [
        KubernetesBaseTestModules,
        CoreModule,

        KubernetesAnalysisReportComponent,
        AnalysisReportViewerComponent,
      ],
      providers: [
        EntityServiceFactory,
        KubernetesAnalysisService,
        KubernetesEndpointService,
        KubeBaseGuidMock,
        TabNavService,
        provideZonelessChangeDetection(),
      ]
    }),
      .compileComponents();
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
