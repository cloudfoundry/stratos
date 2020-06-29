import { Component, ComponentFactoryResolver, OnDestroy, OnInit } from '@angular/core';
import { Edge, Node } from '@swimlane/ngx-graph';
import { SidePanelService } from 'frontend/packages/core/src/shared/services/side-panel.service';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { filter, first, map } from 'rxjs/operators';

import {
  KubernetesResourceViewerComponent,
} from '../../../../kubernetes-resource-viewer/kubernetes-resource-viewer.component';
import { KubeAPIResource } from '../../../../store/kube.types';
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

@Component({
  selector: 'app-helm-release-resource-graph',
  templateUrl: './helm-release-resource-graph.component.html',
  styleUrls: ['./helm-release-resource-graph.component.scss']
})
export class HelmReleaseResourceGraphComponent implements OnInit, OnDestroy {

  // see: https://swimlane.github.io/ngx-graph/#/#quick-start

  public nodes: Node[] = [];
  public links: Edge[] = [];

  update$: BehaviorSubject<boolean> = new BehaviorSubject(false);

  fit$: BehaviorSubject<boolean> = new BehaviorSubject(false);

  public layout = 'dagre';

  public layoutIndex = 0;

  private graph: Subscription;

  constructor(
    private componentFactoryResolver: ComponentFactoryResolver,
    private helper: HelmReleaseHelperService,
    private previewPanel: SidePanelService) { }

  ngOnInit() {

    // Listen for the graph
    this.graph = this.helper.fetchReleaseGraph().subscribe(g => {
      const newNodes = [];
      Object.values(g.nodes).forEach((node: any) => {
        const colors = this.getColor(node.data.status);
        newNodes.push({
          id: node.id,
          label: node.label,
          data: {
            ...node.data,
            fill: colors.bg,
            text: colors.fg
          },
        });
      });
      this.nodes = newNodes;

      const newLinks = [];
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
    });
  }

  ngOnDestroy() {
    if (this.graph) {
      this.graph.unsubscribe();
    }
  }

  // Open side panel when node is clicked
  public onNodeClick(node: any) {
    this.previewPanel.show(
      KubernetesResourceViewerComponent,
      {
        title: 'Helm Release Resource Preview',
        resource$: this.getResource(node)
      },
      this.componentFactoryResolver
    );
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

  private getResource(node: any): Observable<KubeAPIResource> {
    return this.helper.fetchReleaseResources().pipe(
      filter(r => !!r),
      map((r: any[]) => Object.values(r).find((res: any) => res.metadata.name === node.label && res.metadata.kind === node.kind)),
      first(),
    );
  }

}
