import { CommonModule, AsyncPipe } from '@angular/common';
import {Component, ComponentFactoryResolver, type OnDestroy, type OnInit, signal, type WritableSignal, inject, ChangeDetectionStrategy } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import {
  AppProgressBarComponent,
  CustomIconComponent,
  CustomTooltipDirective,
  PageSubNavComponent,
  SidePanelService
} from '@stratosui/core';
import { type Edge, NgxGraphModule } from '@swimlane/ngx-graph';
import { combineLatest, type Observable, Subject, type Subscription } from 'rxjs';
import { distinctUntilChanged, filter, first, map, publishReplay, refCount, startWith } from 'rxjs/operators';
import { AnalysisReportRunnerComponent } from '../../../../analysis-report-viewer/analysis-report-runner/analysis-report-runner.component';
import { AnalysisReportSelectorComponent } from '../../../../analysis-report-viewer/analysis-report-selector/analysis-report-selector.component';
import { WorkloadLiveReloadComponent } from '../../workload-live-reload/workload-live-reload.component';

import {
  KubernetesResourceViewerComponent,
} from '../../../../kubernetes-resource-viewer/kubernetes-resource-viewer.component';
import type { AnalysisReport } from '../../../../store/kube.types';
import { type ResourceAlert, ResourceAlertLevel } from '../../../../services/analysis-report.types';
import { KubernetesAnalysisService } from '../../../../services/kubernetes.analysis.service';
import type {
  HelmReleaseGraph,
  HelmReleaseGraphLink,
  HelmReleaseGraphNode,
  HelmReleaseGraphNodeData,
  HelmReleaseResource,
  HelmReleaseResources,
} from '../../../workload.types';
import { getIcon } from '../../icon-helper';
import { HelmReleaseHelperService } from '../helm-release-helper.service';


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

interface AlertSummary {
  color?: string;
  level?: ResourceAlertLevel;
}

interface CustomHelmReleaseGraphNodeData extends HelmReleaseGraphNodeData {
  missing: boolean;
  dash: number;
  fill: string;
  text: string;
  icon: string;
  alerts: ResourceAlert[] | null;
  alertSummary: AlertSummary;
}

@Component({
  selector: 'app-helm-release-resource-graph',
  templateUrl: './helm-release-resource-graph.component.html',
  styleUrls: ['./helm-release-resource-graph.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    AppProgressBarComponent,
    CustomIconComponent,
    CustomTooltipDirective,
    NgxGraphModule,
    PageSubNavComponent,
    AnalysisReportRunnerComponent,
    AnalysisReportSelectorComponent,
    WorkloadLiveReloadComponent
  ]
})
export class HelmReleaseResourceGraphComponent implements OnInit, OnDestroy {

  // see: https://swimlane.github.io/ngx-graph/#/#quick-start

  public nodes: CustomHelmReleaseGraphNode[] = [];
  public links: Edge[] = [];

  private updateSignal: WritableSignal<boolean> = signal<boolean>(false);
  update$ = toObservable(this.updateSignal);

  private fitSignal: WritableSignal<boolean> = signal<boolean>(false);
  fit$ = toObservable(this.fitSignal);

  public layout = 'dagre';

  public layoutIndex = 0;

  private graph: Subscription;

  private didInitialFit = false;

  public path: string;

  private analysisReportUpdated = new Subject<AnalysisReport | null>();
  private analysisReportUpdated$ = this.analysisReportUpdated.pipe(
    startWith(null as AnalysisReport | null),
    distinctUntilChanged(),
    publishReplay(1),
    refCount()
  );  private componentFactoryResolver = inject(ComponentFactoryResolver);
  private helper = inject(HelmReleaseHelperService);
  public analyzerService = inject(KubernetesAnalysisService);
  private previewPanel = inject(SidePanelService);



  constructor() {


    this.path = `${this.helper.namespace}/${this.helper.releaseTitle}`;


  }

  ngOnInit() {

    // Listen for the graph
    this.graph = combineLatest([
      this.helper.fetchReleaseGraph(),
      this.analysisReportUpdated$
    ]).subscribe(([g, report]: [HelmReleaseGraph, AnalysisReport | null]) => {
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
            icon: icon.name,
            alerts: null,
            alertSummary: {}
          },
        };

        // Does this node have any alerts?
        this.applyAlertToNode(newNode, report);

        newNodes.push(newNode);
      });
      this.nodes = newNodes;

      const newLinks: HelmReleaseGraphLink[] = [];
      Object.values(g.links).forEach((link: HelmReleaseGraphLink) => {
        newLinks.push({
          id: link.id,
          label: link.label,
          source: link.source,
          target: link.target
        });
      });
      this.links = newLinks;
      this.updateSignal.set(true);

      if (!this.didInitialFit) {
        this.didInitialFit = true;
        setTimeout(() => this.fitGraph(), 10);
      }
    });
  }

  private applyAlertToNode(newNode: CustomHelmReleaseGraphNode, report: AnalysisReport | null) {
    if (report?.alerts) {
      Object.values(report.alerts).forEach((group: ResourceAlert[]) => {
        group.forEach(alert => {
          if (
            newNode.data.kind.toLowerCase() === alert.kind &&
            newNode.data.metadata.name === alert.name
            // namespace is undefined, however the only resources we have should be from the correct context
          ) {
            newNode.data.alerts = newNode.data.alerts || [];
            newNode.data.alerts.push(alert);
            newNode.data.alertSummary = newNode.data.alertSummary || {};
            if (alert.level > (newNode.data.alertSummary.level || 0)) {
              newNode.data.alertSummary.color = this.alertLevelToColor(alert.level);
              newNode.data.alertSummary.level = alert.level;
            }
          }
        });
      });
    }
  }

  private alertLevelToColor(level: ResourceAlertLevel) {
    // These colours need to come from theme - #420
    switch (level) {
      case ResourceAlertLevel.Info:
        return '#42a5f5';
      case ResourceAlertLevel.Warning:
        return '#ff9800';
      case ResourceAlertLevel.Error:
        return '#f44336';
    }
  }

  ngOnDestroy() {
    if (this.graph) {
      this.graph.unsubscribe();
    }
  }

  // Open side panel when node is clicked
  public onNodeClick(node: CustomHelmReleaseGraphNode) {
    this.analysisReportUpdated$.pipe(first()).subscribe((analysis: AnalysisReport | null) => {
      this.previewPanel.show(
        KubernetesResourceViewerComponent,
        {
          title: 'Helm Release Resource Preview',
          resource$: this.getResource(node),
          analysis,
          resourceKind: node.data.kind
        },
        this.componentFactoryResolver
      );
    });

  }

  public fitGraph() {
    this.fitSignal.set(true);
  }

  public toggleLayout() {
    this.layoutIndex++;
    if (this.layoutIndex === layouts.length) {
      this.layoutIndex = 0;
    }

    this.layout = layouts[this.layoutIndex];
  }

  private getColor(status: string): Colors {
    switch (status) {
      case 'error':
        return {
          bg: 'red',
          fg: 'white'
        };
      case 'ok':
        return {
          bg: 'green',
          fg: 'white'
        };
      case 'warn':
        return {
          bg: 'orange',
          fg: 'white'
        };
      default:
        return {
          bg: '#5a9cb0',
          fg: 'white'
        };
    }
  }

  private getResource(node: CustomHelmReleaseGraphNode): Observable<HelmReleaseResource | undefined> {
    return this.helper.fetchReleaseResources().pipe(
      filter((r: HelmReleaseResources) => !!r),
      map((r: HelmReleaseResources) => Object.values(r.data).find((res: HelmReleaseResource) =>
        res.metadata.name === node.label && res.kind === node.data.kind
      )),
      first(),
    );
  }

  public analysisChanged(report: { id: string } | null) {
    if (report === null) {
      this.analysisReportUpdated.next(null);
    } else {
      this.analyzerService.getByID(this.helper.endpointGuid, report.id).subscribe((results: AnalysisReport) => {
        this.analysisReportUpdated.next(results);
      });
    }
  }

}
