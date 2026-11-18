import { HttpClient, HttpHandler } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { of, Subject } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import {
  ConfirmationDialogService,
  EndpointsSignalService,
  SidePanelService,
  TabNavService,
  TailwindSnackBarRef,
  TailwindSnackBarService,
} from '@stratosui/core';
import {
  CATALOGUE_ENTITIES,
} from '@stratosui/store';

import { generateHelmEntities } from '../../../../../helm/helm-entity-generator';
import { KubePodDataService } from '../../../../../services/domain-data/kube-pod-data.service';
import { KubeHelmDataService } from '../../../../../services/endpoint-data/kube-helm-data.service';
import { KubernetesBaseTestModules, KubeBaseGuidMock } from '../../../../kubernetes.testing.module';
import { KubernetesAnalysisService } from '../../../../services/kubernetes.analysis.service';
import { KubernetesEndpointService } from '../../../../services/kubernetes-endpoint.service';
import { HelmReleaseHelperService } from '../helm-release-helper.service';
import { HelmReleaseActivatedRouteMock, HelmReleaseGuidMock } from '../../../../../helm/helm-testing.module';
import { HelmReleaseDataService } from '../../helm-release-data.service';
import { HelmReleaseGuid, HelmReleaseGraph } from '../../../workload.types';
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

  // Picking a report sends a request; a slow answer for an earlier pick must
  // not replace the report picked last.
  it('keeps the analysis report picked last when the first answers late', async () => {
    const first = new Subject<unknown>();
    const second = new Subject<unknown>();
    vi.spyOn(component.analyzerService, 'getByID').mockImplementation(
      (_ep: string, id: string) => (id === 'r1' ? first : second) as never);

    component.analysisChanged({ id: 'r1' });
    component.analysisChanged({ id: 'r2' });
    second.next({ id: 'r2', alerts: {} });
    first.next({ id: 'r1', alerts: {} });
    await fixture.whenStable();

    const shown = (component as unknown as { analysisReport: () => { id: string } | null }).analysisReport();
    expect(shown?.id).toBe('r2');
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

// What the page shows from the release's own data: the resource cards, the
// cluster name and the upgrade badge all come from signals.
describe('HelmReleaseSummaryTabComponent view', () => {
  const GUID = 'cnsi-1:ns-a:rel-x';
  let fixture: ComponentFixture<HelmReleaseSummaryTabComponent>;
  let component: HelmReleaseSummaryTabComponent;
  const endpoints = signal<Record<string, { name: string }>>({});
  const charts = signal<unknown[]>([]);

  const node = (id: string, kind: string, status = 'ok') =>
    ({ id, label: id, data: { kind, status, metadata: { name: id, namespace: 'ns-a' } } });
  const graphOf = (...nodes: ReturnType<typeof node>[]) => ({
    endpointId: 'cnsi-1', releaseTitle: 'rel-x',
    nodes: Object.fromEntries(nodes.map(n => [n.id, n])), links: {},
  } as unknown as HelmReleaseGraph);
  const cardLabels = () => [...fixture.nativeElement.querySelectorAll('app-card-number-metric')]
    .map((el: HTMLElement) => el.textContent?.replace(/\s+/g, ' ').trim());

  beforeEach(async () => {
    endpoints.set({});
    charts.set([]);
    await TestBed.configureTestingModule({
      imports: [...KubernetesBaseTestModules, HelmReleaseSummaryTabComponent],
      providers: [
        HelmReleaseHelperService,
        HelmReleaseSocketService,
        HelmReleaseActivatedRouteMock,
        { provide: HelmReleaseGuid, useValue: { guid: GUID } },
        TabNavService,
        KubernetesAnalysisService,
        KubernetesEndpointService,
        KubeBaseGuidMock,
        SidePanelService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: CATALOGUE_ENTITIES, useFactory: () => [...generateHelmEntities()], multi: true },
        provideZonelessChangeDetection(),
      ]
    }).compileComponents();
    Object.defineProperty(TestBed.inject(EndpointsSignalService), 'endpoints', { value: endpoints });
    const helmData = TestBed.inject(KubeHelmDataService);
    vi.spyOn(helmData, 'monocularCharts').mockReturnValue(charts as never);
    vi.spyOn(helmData, 'loadCharts').mockResolvedValue(undefined as never);

    fixture = TestBed.createComponent(HelmReleaseSummaryTabComponent);
    component = fixture.componentInstance;
    TestBed.inject(HttpTestingController).expectOne('/pp/v1/helm/releases/cnsi-1/ns-a/rel-x').flush({
      name: 'rel-x', namespace: 'ns-a', version: 1, status: 'deployed', info: {},
      chart: { metadata: { name: 'nginx', description: 'web server', version: '1.0.0' } },
    });
    await fixture.whenStable();
  });

  it('names the cluster once its endpoint has hydrated', async () => {
    const cluster = () => fixture.nativeElement.querySelector('app-metadata-item[label="Cluster"] a')?.textContent?.trim();
    expect(cluster()).toBe('');

    endpoints.set({ 'cnsi-1': { name: 'prod-east' } });
    await fixture.whenStable();

    expect(cluster()).toBe('prod-east');
  });

  it('shows one card per resource kind, counted, as the graph updates', async () => {
    TestBed.inject(HelmReleaseDataService).setGraph(GUID, graphOf(node('a', 'Pod'), node('b', 'Pod'), node('c', 'Service')));
    await fixture.whenStable();
    expect(component.resources().map(r => [r.kind, r.count])).toEqual([['Pod', 2], ['Service', 1]]);
    expect(cardLabels().length).toBe(2);

    TestBed.inject(HelmReleaseDataService).setGraph(GUID, graphOf(node('a', 'Pod')));
    await fixture.whenStable();
    expect(component.resources().map(r => [r.kind, r.count])).toEqual([['Pod', 1]]);
    expect(cardLabels().length).toBe(1);
  });

  it('counts the workload pods by phase for the ring charts', async () => {
    TestBed.inject(KubePodDataService).setWorkloadPods('cnsi-1', 'ns-a', 'rel-x', [
      { metadata: { name: 'p1' }, status: { phase: 'Running', containerStatuses: [{ state: { running: {} } }] } } as never,
    ]);
    await fixture.whenStable();
    expect(component.chartData().podsChartData.find(d => d.name === 'Running')?.value).toBe(1);
  });

  it('offers the upgrade once a newer chart version is published', async () => {
    const badge = () => fixture.nativeElement.textContent.includes('Upgrade available: 2.0.0');
    expect(badge()).toBe(false);

    charts.set([{
      attributes: { name: 'nginx', description: 'web server' },
      relationships: { latestChartVersion: { data: { version: '2.0.0' } } },
    }]);
    await fixture.whenStable();

    expect(badge()).toBe(true);
    expect(component.canUpgrade()).toBe(true);
  });
});
