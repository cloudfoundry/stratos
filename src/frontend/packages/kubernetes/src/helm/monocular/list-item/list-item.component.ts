import { AsyncPipe, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnInit} from '@angular/core';
import { RouterLink } from '@angular/router';
import { CustomTooltipDirective } from '@stratosui/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { Chart } from '../shared/models/chart';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-list-item',
  templateUrl: './list-item.component.html',
  styleUrls: ['./list-item.component.scss'],
  standalone: true,
  imports: [
    AsyncPipe,
    NgClass,
    RouterLink,
    CustomTooltipDirective,
  ]
})
export class ListItemComponent implements OnInit {

  @Input() height = 'default';
  @Input() public artifactHubAndHelmRepoTypes$: Observable<boolean>;
  @Input() chart!: Chart;

  @Input() public detailUrl: string;
  public showArtifactHub$!: Observable<boolean>;

  ngOnInit() {
    this.showArtifactHub$ = this.artifactHubAndHelmRepoTypes$ ? this.artifactHubAndHelmRepoTypes$.pipe(
      map(artifactHubAndHelmRepoTypes =>
        // Only show if we have artifact hub registered, there's other helm repo's also registered and this chart is from artifact hub
        artifactHubAndHelmRepoTypes && !!this.chart.monocularEndpointId
      ),
    ) : of(false);
  }
}
