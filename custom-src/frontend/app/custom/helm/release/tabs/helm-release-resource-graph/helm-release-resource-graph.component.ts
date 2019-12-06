import { Node, Edge } from '@swimlane/ngx-graph';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { HelmReleaseHelperService } from '../helm-release-helper.service';
import { Subject, Subscription } from 'rxjs';
import { PanelPreviewService } from '../../../../../shared/services/panel-preview.service';
import { HelmReleaseResourcePreviewComponent } from './helm-release-resource-preview/helm-release-resource-preview.component';

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

  public nodes = [] as Node[];
  public links = [] as Edge[];

  update$: Subject<boolean> = new Subject();

  fit$: Subject<boolean> = new Subject();

  public layout = 'dagre';

  public layoutIndex = 0;

  private graph: Subscription;

  constructor(private helper: HelmReleaseHelperService, private previewPanel: PanelPreviewService) { }

  ngOnInit() {

    console.log('GOING TO WAIT FOR RESOURCE GRAPH.....');

    // Listen for the graph
    this.graph = this.helper.fetchReleaseGraph().subscribe((g: any) => {
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
    console.log('Node was clicked')
    console.log(node);

    this.previewPanel.show(
      HelmReleaseResourcePreviewComponent,
      {
        node
      }
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

  public onZoomChanged(e) {
    //console.log(e);
  }

}
