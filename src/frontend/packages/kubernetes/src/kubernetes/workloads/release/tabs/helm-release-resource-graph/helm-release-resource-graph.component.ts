import { CommonModule } from '@angular/common';
import { Component, signal, WritableSignal, computed, effect, inject, untracked, ChangeDetectionStrategy, Injector } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { AppProgressBarComponent } from '../../../../../../../core/src/shared/components/progress-bar/app-progress-bar.component';
import { CustomIconComponent } from '../../../../../../../core/src/shared/components/custom-material/custom-material.component';
import { CustomTooltipDirective } from '../../../../../../../core/src/shared/components/custom-tooltip/custom-tooltip.directive';
import { Edge, GraphComponent, LayoutService, NgxGraphZoomOptions } from '@swimlane/ngx-graph';
import { SidePanelService } from '@stratosui/core';
import { EMPTY, Observable, of, Subject } from 'rxjs';
import { catchError, take, filter, map, switchMap } from 'rxjs/operators';

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
export class HelmReleaseResourceGraphComponent {

  // see: https://swimlane.github.io/ngx-graph/#/#quick-start

  // The graph as the release socket last sent it, with the alerts of the
  // chosen analysis report drawn on its nodes.
  public nodes = computed<CustomHelmReleaseGraphNode[]>(() => {
    const graph = this.helper.graph();
    const report = this.analysisReport();
    return Object.values(graph?.nodes ?? {}).map((node: HelmReleaseGraphNode) => {
      const colors = this.getColor(node.data.status);
      const missing = node.data.status === 'missing';

      const newNode: CustomHelmReleaseGraphNode = {
        id: node.id,
        label: node.label,
        data: {
          ...node.data,
          missing,
          dash: missing ? 6 : 0,
          fill: colors.bg,
          text: colors.fg,
          icon: getIcon(node.data.kind),
          alerts: null,
          alertSummary: {}
        } };

      // Does this node have any alerts?
      this.applyAlertToNode(newNode, report);
      return newNode;
    });
  });
  public links = computed<Edge[]>(() =>
    Object.values(this.helper.graph()?.links ?? {}).map((link: any): HelmReleaseGraphLink => ({
      id: link.id,
      label: link.id,
      source: link.source,
      target: link.target
    })),
  );

  // An event trigger: every emission makes ngx-graph redraw. A signal would
  // drop every set after the first, because the value never changes.
  private readonly update = new Subject<boolean>();
  update$ = this.update.asObservable();

  // ngx-graph zooms-to-fit on every emission; the options object matches
  // the [zoomToFit$] input's Observable<NgxGraphZoomOptions> type.
  private fitSignal: WritableSignal<NgxGraphZoomOptions> = signal<NgxGraphZoomOptions>({});
  fit$ = toObservable(this.fitSignal);

  public layout = signal('dagre');

  public layoutIndex = 0;

  public path: string;

  // The analysis report whose alerts are drawn on the nodes; null for none
  private readonly analysisReport = signal<any>(null);
  private readonly analysisPick = new Subject<string | null>();
  protected helper = inject(HelmReleaseHelperService);
  public analyzerService = inject(KubernetesAnalysisService);
  private previewPanel = inject(SidePanelService);
  private injector = inject(Injector);



  constructor() {
    // Only the report picked last is kept: choosing another one cancels the
    // request still in flight, so a slow answer cannot replace a newer pick.
    this.analysisPick.pipe(
      switchMap(id => id === null ? of(null) : this.analyzerService.getByID(this.helper.endpointGuid, id).pipe(
        catchError(() => EMPTY)
      )),
      takeUntilDestroyed()
    ).subscribe(results => this.analysisReport.set(results));


    this.path = `${this.helper.namespace}/${this.helper.releaseTitle}`;

    // Every new graph, or report drawn on it, asks ngx-graph to redraw.
    effect(() => {
      this.nodes();
      this.links();
      untracked(() => this.update.next(true));
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

  // Open side panel when node is clicked
  public onNodeClick(node: CustomHelmReleaseGraphNode) {
    this.previewPanel.show(
      KubernetesResourceViewerComponent,
      {
        title: 'Helm Release Resource Preview',
        resource$: this.getResource(node),
        analysis: this.analysisReport(),
        resourceKind: node.data.kind
      }
    );
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
    return toObservable(this.helper.resources, { injector: this.injector }).pipe(
      filter((r: any) => !!r),
      map((r: HelmReleaseResources) => Object.values(r.data).find((res: any) =>
        res.metadata.name === node.label && res.kind === node.data.kind
      )),
      take(1),
    );
  }

  public analysisChanged(report: any) {
    this.analysisPick.next(report === null ? null : report.id);
  }

}
