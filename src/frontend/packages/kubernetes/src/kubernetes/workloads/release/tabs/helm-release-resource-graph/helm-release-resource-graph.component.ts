import { CommonModule } from '@angular/common';
import {Component, OnDestroy, OnInit, signal, WritableSignal, inject, ChangeDetectionStrategy } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { AppProgressBarComponent } from '../../../../../../../core/src/shared/components/progress-bar/app-progress-bar.component';
import { CustomIconComponent } from '../../../../../../../core/src/shared/components/custom-material/custom-material.component';
import { CustomTooltipDirective } from '../../../../../../../core/src/shared/components/custom-tooltip/custom-tooltip.directive';
import { Edge, NgxGraphModule } from '@swimlane/ngx-graph';
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
  HelmReleaseGraphLink,
  HelmReleaseGraphNode,
  HelmReleaseGraphNodeData,
  HelmReleaseResource,
  HelmReleaseResources } from '../../../workload.types';
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

interface CustomHelmReleaseGraphNodeData extends HelmReleaseGraphNodeData {
  missing: boolean;
  dash: number;
  fill: string;
  text: string;
  icon: any;
  alerts: [];
  alertSummary: Record<string, unknown>;
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

  private analysisReportUpdated = new Subject<any>();
  private analysisReportUpdated$ = this.analysisReportUpdated.pipe(
    startWith(null),
    distinctUntilChanged(),
    publishReplay(1),
    refCount()
  );
  private helper = inject(HelmReleaseHelperService);
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
    ).subscribe(([g, report]: [any, any]) => {
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
            alertSummary: Record<string, unknown>
          } };

        // Does this node have any alerts?
        this.applyAlertToNode(newNode, report);

        newNodes.push(newNode);
      });
      this.nodes = newNodes;

      const newLinks: HelmReleaseGraphLink[] = [];
      Object.values(g.links).forEach((link: any) => {
        newLinks.push({
          id: link.id,
          label: link.id,
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

  private applyAlertToNode(newNode: CustomHelmReleaseGraphNode, report: any) {
    if (report && report.alerts) {
      Object.values(report.alerts).forEach((group: ResourceAlert[]) => {
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

  private getResource(node: CustomHelmReleaseGraphNode): Observable<HelmReleaseResource> {
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
