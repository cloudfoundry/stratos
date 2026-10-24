import { HttpClient, HttpHandler } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import {
  ConfirmationDialogService,
  SidePanelService,
  TabNavService,
  TailwindSnackBarRef,
  TailwindSnackBarService,
} from '@stratosui/core';
import {
  CATALOGUE_ENTITIES,
} from '@stratosui/store';

import { generateHelmEntities } from '../../../../../helm/helm-entity-generator';
import { KubeHelmDataService } from '../../../../../services/endpoint-data/kube-helm-data.service';
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

  // After a delete succeeds, leaving the page clears only an earlier
  // "Failed to delete release" message; hide() would also dismiss other
  // features' messages.
  it('dismisses only its own failed-delete message once the release is deleted', async () => {
    const snackbar = TestBed.inject(TailwindSnackBarService);
    const failedRef = { dismiss: vi.fn(), afterDismissed: () => of(null) };
    vi.spyOn(snackbar, 'show').mockReturnValue(failedRef as unknown as TailwindSnackBarRef<unknown>);
    const hide = vi.spyOn(snackbar, 'hide');
    vi.spyOn(TestBed.inject(ConfirmationDialogService), 'open').mockImplementation((_config, onConfirm) => onConfirm());
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(TestBed.inject(KubeHelmDataService), 'delete')
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce(undefined);

    component.deleteRelease();
    await fixture.whenStable();
    expect(snackbar.show).toHaveBeenCalledWith('Failed to delete release', 'Close');

    component.deleteRelease();
    await fixture.whenStable();
    fixture.destroy();

    expect(failedRef.dismiss).toHaveBeenCalledTimes(1);
    expect(hide).not.toHaveBeenCalled();
  });
});
