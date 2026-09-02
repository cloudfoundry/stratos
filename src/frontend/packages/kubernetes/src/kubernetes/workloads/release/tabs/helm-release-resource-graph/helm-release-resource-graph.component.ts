import { CommonModule } from '@angular/common';
import {Component, OnDestroy, OnInit, signal, WritableSignal, inject, ChangeDetectionStrategy } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { AppProgressBarComponent } from '../../../../../../../core/src/shared/components/progress-bar/app-progress-bar.component';
import { CustomIconComponent } from '../../../../../../../core/src/shared/components/custom-material/custom-material.component';
import { CustomTooltipDirective } from '../../../../../../../core/src/shared/components/custom-tooltip/custom-tooltip.directive';
import { Edge, GraphComponent, LayoutService, NgxGraphZoomOptions } from '@swimlane/ngx-graph';
import { SidePanelService } from '@stratosui/core';
import { combineLatest, Observable, Subject, Subscription } from 'rxjs';
import { take, distinctUntilChanged, filter, map, publishReplay, refCount, startWith } from 'rxjs/operators';

import { PageSubNavComponent } from '../../../../../../../core/src/shared/components/page-sub-nav/page-sub-nav.component';
import { AnalysisReportRunnerComponent } from '../../../../analysis-report-viewer/analysis-report-runner/analysis-report-runner.component';
import { AnalysisReportSelectorComponent } from '../../../../analysis-report-viewer/analysis-report-selector/analysis-report-selector.component';
import { WorkloadLiveReloadComponent } from '../../workload-live-reload/workload-live-reload.component';

import {
  KubernetesResourceViewerComponent } from '../../../../kubernetes-resource-viewer/kubernetes-resource-viewer.component';
import { ResourceAlert, ResourceAlertLevel } from '../../../../services/analysis-report.types';
import { KubernetesAnalysisService } from '../../../../services/kubernetes.analysis.service';
import {
  HelmReleaseGraph,
  HelmReleaseGraphLink,
  HelmReleaseGraphNode,
  HelmReleaseGraphNodeData,
  HelmReleaseResource,
  HelmReleaseResources } from '../../../workload.types';
import { getIcon } from '../../icon-helper';
import { HelmReleaseHelperService } from '../helm-release-helper.service';


const cssVar = (n: string) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

interface Colors {
  bg: string;
  fg: string;
}

const layouts = [
  'dagre',
  'd3ForceDirected',
  'colaForceDirected'
];

interface CustomHelmReleaseGraphNode extends Omit<HelmReleaseGraphNode, 'data'> {
  data: CustomHelmReleaseGraphNodeData;
}

interface CustomHelmReleaseGraphNode {
  id: string;
  label: string;
  data: CustomHelmReleaseGraphNodeData;
}

interface CustomHelmReleaseGraphNodeData extends HelmReleaseGraphNodeData {
  missing: boolean;
  dash: number;
  fill: string;
  text: string;
  icon: any;
  alerts: ResourceAlert[] | null;
  alertSummary: Record<string, unknown>;
}

@Component({
  selector: 'app-helm-release-resource-graph',
  templateUrl: './helm-release-resource-graph.component.html',
  styleUrls: ['./helm-release-resource-graph.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  // ngx-graph 12+ declares LayoutService without providedIn and only the
  // deprecated NgxGraphModule provides it; the standalone GraphComponent
  // injects it, so the consumer has to supply it.
  providers: [LayoutService],
  imports: [
    CommonModule,
    AppProgressBarComponent,
    CustomIconComponent,
    CustomTooltipDirective,
    GraphComponent,
    PageSubNavComponent,
    AnalysisReportRunnerComponent,
    AnalysisReportSelectorComponent,
    WorkloadLiveReloadComponent
  ]
})
export class HelmReleaseResourceGraphComponent implements OnInit, OnDestroy {

  // see: https://swimlane.github.io/ngx-graph/#/#quick-start

  // Signals: the view is OnPush under zoneless change detection, so plain
  // fields written from the socket subscription never re-rendered the graph.
  public nodes = signal<CustomHelmReleaseGraphNode[]>([]);
  public links = signal<Edge[]>([]);

  private updateSignal: WritableSignal<boolean> = signal<boolean>(false);
  update$ = toObservable(this.updateSignal);

  // ngx-graph zooms-to-fit on every emission; the options object matches
  // the [zoomToFit$] input's Observable<NgxGraphZoomOptions> type.
  private fitSignal: WritableSignal<NgxGraphZoomOptions> = signal<NgxGraphZoomOptions>({});
  fit$ = toObservable(this.fitSignal);

  public layout = signal('dagre');

  public layoutIndex = 0;

  private graph?: Subscription;

  public path: string;

  private analysisReportUpdated = new Subject<any>();
  private analysisReportUpdated$ = this.analysisReportUpdated.pipe(
    startWith(null),
    distinctUntilChanged(),
    publishReplay(1),
    refCount()
  );
  protected helper = inject(HelmReleaseHelperService);
  public analyzerService = inject(KubernetesAnalysisService);
  private previewPanel = inject(SidePanelService);



  constructor() {


    this.path = `${this.helper.namespace}/${this.helper.releaseTitle}`;


  }

  ngOnInit() {

    // Listen for the graph
    this.graph = combineLatest(
      this.helper.fetchReleaseGraph(),
      this.analysisReportUpdated$
    ).subscribe(([g, report]: [HelmReleaseGraph, any]) => {
      const newNodes: CustomHelmReleaseGraphNode[] = [];
      Object.values(g.nodes).forEach((node: HelmReleaseGraphNode) => {
        const colors = this.getColor(node.data.status);
        const icon = getIcon(node.data.kind);
        const missing = node.data.status === 'missing';

        const newNode: CustomHelmReleaseGraphNode = {
          id: node.id,
          label: node.label,
          data: {
            ...node.data,
            missing: node.data.status === 'missing',
            dash: missing ? 6 : 0,
            fill: colors.bg,
            text: colors.fg,
            icon,
            alerts: null,
            alertSummary: {}
          } };

        // Does this node have any alerts?
        this.applyAlertToNode(newNode, report);

        newNodes.push(newNode);
      });
      this.nodes.set(newNodes);

      const newLinks: HelmReleaseGraphLink[] = [];
      Object.values(g.links).forEach((link: any) => {
        newLinks.push({
          id: link.id,
          label: link.id,
          source: link.source,
          target: link.target
        });
      });
      this.links.set(newLinks);
      this.updateSignal.set(true);
    });
  }

  private applyAlertToNode(newNode: CustomHelmReleaseGraphNode, report: any) {
    if (report && report.alerts) {
      Object.values<ResourceAlert[]>(report.alerts).forEach((group: ResourceAlert[]) => {
        group.forEach(alert => {
          if (
            newNode.data.kind.toLowerCase() === alert.kind &&
            newNode.data.metadata.name === alert.name
            // namespace is undefined, however the only resources we have should be from the correct context
          ) {
            newNode.data.alerts = newNode.data.alerts || [];
            (newNode.data.alerts as any).push(alert);
            newNode.data.alertSummary = newNode.data.alertSummary || {};
            if (alert.level > (newNode.data.alertSummary as any).level || !(newNode.data.alertSummary as any).level) {
              (newNode.data.alertSummary as any).color = this.alertLevelToColor(alert.level);
              (newNode.data.alertSummary as any).level = alert.level;
            }
          }
        });
      });
    }
  }

  private alertLevelToColor(level: ResourceAlertLevel) {
    switch (level) {
      case ResourceAlertLevel.Info:
        return cssVar('--color-info');
      case ResourceAlertLevel.Warning:
        return cssVar('--color-warning');
      case ResourceAlertLevel.Error:
        return cssVar('--color-danger');
    }
  }

  ngOnDestroy() {
    if (this.graph) {
      this.graph.unsubscribe();
    }
  }

  // Open side panel when node is clicked
  public onNodeClick(node: CustomHelmReleaseGraphNode) {
    this.analysisReportUpdated$.pipe(take(1)).subscribe((analysis: any) => {
      this.previewPanel.show(
        KubernetesResourceViewerComponent,
        {
          title: 'Helm Release Resource Preview',
          resource$: this.getResource(node),
          analysis,
          resourceKind: node.data.kind
        }
      );
    });

  }

  public fitGraph() {
    this.fitSignal.set({});
  }

  public toggleLayout() {
    this.layoutIndex++;
    if (this.layoutIndex === layouts.length) {
      this.layoutIndex = 0;
    }

    this.layout.set(layouts[this.layoutIndex]);
  }

  private getColor(status: string): Colors {
    switch (status) {
      case 'error':
        return {
          bg: cssVar('--color-danger'),
          fg: 'white'
        };
      case 'ok':
        return {
          bg: cssVar('--color-success'),
          fg: 'white'
        };
      case 'warn':
        return {
          bg: cssVar('--color-warning'),
          fg: 'white'
        };
      default:
        return {
          bg: cssVar('--content-muted'),
          fg: 'white'
        };
    }
  }

  private getResource(node: CustomHelmReleaseGraphNode): Observable<HelmReleaseResource | undefined> {
    return this.helper.fetchReleaseResources().pipe(
      filter((r: any) => !!r),
      map((r: HelmReleaseResources) => Object.values(r.data).find((res: any) =>
        res.metadata.name === node.label && res.kind === node.data.kind
      )),
      take(1),
    );
  }

  public analysisChanged(report: any) {
    if (report === null) {
      this.analysisReportUpdated.next(null);
    } else {
      this.analyzerService.getByID(this.helper.endpointGuid, report.id).subscribe((results: any) => {
        this.analysisReportUpdated.next(results);
      });
    }
  }

}
