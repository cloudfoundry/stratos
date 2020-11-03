import { Component, Input, OnInit } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { Chart } from '../shared/models/chart';

@Component({
  selector: 'app-list-item',
  templateUrl: './list-item.component.html',
  styleUrls: ['./list-item.component.scss'],
  /* tslint:disable-next-line:no-inputs-metadata-property */
  inputs: ['detailUrl'],
})
export class ListItemComponent implements OnInit {

  @Input() height = 'default';
  @Input() public artifactHubAndHelmRepoTypes$: Observable<boolean>;
  @Input() chart: Chart;

  public detailUrl: string;
  public showArtifactHub$: Observable<boolean>;

  ngOnInit() {
    this.showArtifactHub$ = this.artifactHubAndHelmRepoTypes$ ? this.artifactHubAndHelmRepoTypes$.pipe(
      map(artifactHubAndHelmRepoTypes =>
        // Only show if we have artifact hub registered, there's other helm repo's also registered and this chart is from artifact hub
        artifactHubAndHelmRepoTypes && !!this.chart.monocularEndpointId
      ),
    ) : of(false);
  }
}
