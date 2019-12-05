import { Component } from '@angular/core';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { HelmReleaseService } from '../../../services/helm-release.service';

@Component({
  selector: 'app-helm-release-summary-card',
  templateUrl: './helm-release-summary-card.component.html',
  styleUrls: ['./helm-release-summary-card.component.scss']
})
export class HelmReleaseSummaryCardComponent {
  chartName$: Observable<string>;

  constructor(
    public helmReleaseService: HelmReleaseService
  ) {
    // get chart name
    this.chartName$ = combineLatest(this.helmReleaseService.deployments$, this.helmReleaseService.statefulSets$).pipe(
      map(([deployments, statefulsets]) => {
        if (deployments.length !== 0) {
          return deployments[0].metadata.labels.chart;
        }
        if (statefulsets.length !== 0) {
          return statefulsets[0].metadata.labels.chart;
        }
      })
    );
  }
}
