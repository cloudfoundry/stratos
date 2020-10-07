import { Component, ComponentFactoryResolver, OnDestroy, OnInit } from '@angular/core';
import { Edge } from '@swimlane/ngx-graph';
import { SidePanelService } from 'frontend/packages/core/src/shared/services/side-panel.service';
import { BehaviorSubject, combineLatest, Observable, Subject, Subscription } from 'rxjs';
import { distinctUntilChanged, filter, first, map, publishReplay, refCount, startWith } from 'rxjs/operators';

import {
  KubernetesResourceViewerComponent,
} from '../../../../kubernetes-resource-viewer/kubernetes-resource-viewer.component';
import { ResourceAlert, ResourceAlertLevel } from '../../../../services/analysis-report.types';
import { KubernetesAnalysisService } from '../../../../services/kubernetes.analysis.service';
import {
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

interface CustomHelmReleaseGraphNodeData extends HelmReleaseGraphNodeData {
  missing: boolean,
  dash: number,
  fill: string,
  text: string,
  icon: any,
  alerts: [],
  alertSummary: {};
}

@Component({
  selector: 'app-helm-release-resource-graph',
  templateUrl: './helm-release-resource-graph.component.html',
  styleUrls: ['./helm-release-resource-graph.component.scss']
})
export class HelmReleaseResourceGraphComponent implements OnInit, OnDestroy {

  // see: https://swimlane.github.io/ngx-graph/#/#quick-start

  public nodes: CustomHelmReleaseGraphNode[] = [];
  public links: Edge[] = [];

  update$: BehaviorSubject<boolean> = new BehaviorSubject(false);

  fit$: BehaviorSubject<boolean> = new BehaviorSubject(false);

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

  constructor(
    private componentFactoryResolver: ComponentFactoryResolver,
    private helper: HelmReleaseHelperService,
    public analyzerService: KubernetesAnalysisService,
    private previewPanel: SidePanelService) {
    this.path = `${this.helper.namespace}/${this.helper.releaseTitle}`;
  }

  ngOnInit() {

    // Listen for the graph
    this.graph = combineLatest(
      this.helper.fetchReleaseGraph(),
      this.analysisReportUpdated$
    ).subscribe(([g, report]) => {
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
          },
        };

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
      this.update$.next(true);

      if (!this.didInitialFit) {
        this.didInitialFit = true;
        setTimeout(() => this.fitGraph(), 10);
      }
    });
  }

  private applyAlertToNode(newNode, report) {
    if (report && report.alerts) {
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
            if (alert.level > newNode.data.alertSummary.level || !newNode.data.alertSummary.level) {
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
    this.analysisReportUpdated$.pipe(first()).subscribe(analysis => {
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
    this.fit$.next(true);
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
      filter(r => !!r),
      map((r: HelmReleaseResources) => Object.values(r.data).find((res) =>
        res.metadata.name === node.label && res.kind === node.data.kind
      )),
      first(),
    );
  }

  public analysisChanged(report) {
    if (report === null) {
      this.analysisReportUpdated.next(null);
    } else {
      this.analyzerService.getByID(this.helper.endpointGuid, report.id).subscribe(results => {
        this.analysisReportUpdated.next(results);
      });
    }
  }

}
