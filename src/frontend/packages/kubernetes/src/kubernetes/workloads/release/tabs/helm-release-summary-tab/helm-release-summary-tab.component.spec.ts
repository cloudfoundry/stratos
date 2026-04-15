import { HttpClient, HttpHandler } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';

import { SidePanelService, TabNavService } from '@stratosui/core';
import {
  CATALOGUE_ENTITIES,
} from '@stratosui/store';

import { generateHelmEntities } from '../../../../../helm/helm-entity-generator';
import { KubernetesBaseTestModules, KubeBaseGuidMock } from '../../../../kubernetes.testing.module';
import { KubernetesAnalysisService } from '../../../../services/kubernetes.analysis.service';
import { KubernetesEndpointService } from '../../../../services/kubernetes-endpoint.service';
import { HelmReleaseHelperService } from '../helm-release-helper.service';
import { HelmReleaseActivatedRouteMock, HelmReleaseGuidMock } from '../../../../../helm/helm-testing.module';
import { HelmReleaseSocketService } from '../../helm-release-tab-base/helm-release-socket-service';
import {
  AnalysisReportSelectorComponent,
} from './../../../../analysis-report-viewer/analysis-report-selector/analysis-report-selector.component';
import { HelmReleaseSummaryTabComponent } from './helm-release-summary-tab.component';

describe('HelmReleaseSummaryTabComponent', () => {
  let component: HelmReleaseSummaryTabComponent;
  let fixture: ComponentFixture<HelmReleaseSummaryTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ...KubernetesBaseTestModules,
        HelmReleaseSummaryTabComponent,
        AnalysisReportSelectorComponent,
      ],
      providers: [
        HelmReleaseHelperService,
        HelmReleaseSocketService,
        HelmReleaseActivatedRouteMock,
        HelmReleaseGuidMock,
        TabNavService,
        KubernetesAnalysisService,
        KubernetesEndpointService,
        KubeBaseGuidMock,
        HttpClient,
        HttpHandler,
        SidePanelService,
        {
          provide: CATALOGUE_ENTITIES,
          useFactory: () => {
            return [
              ...generateHelmEntities(),
            ];
          },
          multi: true
        },
        provideZonelessChangeDetection(),
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HelmReleaseSummaryTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
