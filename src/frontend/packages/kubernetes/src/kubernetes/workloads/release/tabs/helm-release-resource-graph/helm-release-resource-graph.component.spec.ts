import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { NgxGraphModule } from '@swimlane/ngx-graph';
import { SidePanelService } from '@stratosui/core';

import { TabNavService } from '../../../../../../../core/src/tab-nav.service';
import { HelmReleaseProviders, KubernetesBaseTestModules } from '../../../../kubernetes.testing.module';
import { KubernetesEndpointService } from '../../../../services/kubernetes-endpoint.service';
import { KubernetesAnalysisService } from '../../../../services/kubernetes.analysis.service';
import {
  AnalysisReportSelectorComponent,
} from './../../../../analysis-report-viewer/analysis-report-selector/analysis-report-selector.component';
import { KubeBaseGuidMock } from './../../../../kubernetes.testing.module';
import { HelmReleaseResourceGraphComponent } from './helm-release-resource-graph.component';

describe('HelmReleaseResourceGraphComponent', () => {
  let component: HelmReleaseResourceGraphComponent;
  let fixture: ComponentFixture<HelmReleaseResourceGraphComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ...KubernetesBaseTestModules,
        NgxGraphModule
      ,
        HelmReleaseResourceGraphComponent,
        AnalysisReportSelectorComponent
      ]providers: [
        
        ...HelmReleaseProviders,
        SidePanelService,
        TabNavService,
        KubernetesAnalysisService,
        KubernetesEndpointService,
        KubeBaseGuidMock,
      ,
        provideZonelessChangeDetection()
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HelmReleaseResourceGraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
