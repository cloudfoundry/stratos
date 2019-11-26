import { Node, Edge } from '@swimlane/ngx-graph';
import { Component, OnInit } from '@angular/core';
import { HelmReleaseHelperService } from '../helm-release-helper.service';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-helm-release-resource-graph',
  templateUrl: './helm-release-resource-graph.component.html',
  styleUrls: ['./helm-release-resource-graph.component.scss']
})
export class HelmReleaseResourceGraphComponent implements OnInit {

  // see: https://swimlane.github.io/ngx-graph/#/#quick-start

  public nodes = [] as Node[];
  public links = [] as Edge[];

  update$: Subject<boolean> = new Subject();

  constructor(private helper: HelmReleaseHelperService) {

    console.log('GOING TO WAIT FOR RESOURCE GRAPH.....');

    // Listen for the graph
    helper.fetchReleaseGraph().subscribe((g: any) => {
      console.log('GOT RELEASE GRAPH');
      console.log(g);

      const newNodes = [];
      Object.values(g.nodes).forEach((node: any) => {
        newNodes.push({
          id: node.id,
          label: node.label,
          data: {
            ...node.data,
            color: this.getColor(node.data.kind),
            fill: this.getColor(node.data.kind),
          },
        });
      });
      console.log('------------');
      console.log(newNodes);
      this.nodes = newNodes;
      this.update$.next(true);
    });
   }

  ngOnInit() { }

  private getColor(resourceType: string): string {
    switch (resourceType) {
      case 'Secret':
        return 'red';
      default:
        return 'blue';
    }
  }

  public onZoomChanged(e) {
    console.log(e);
  }

}
