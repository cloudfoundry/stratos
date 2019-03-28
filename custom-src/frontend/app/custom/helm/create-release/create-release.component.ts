import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { of as observableOf, Subscription } from 'rxjs';

@Component({
  selector: 'app-create-release',
  templateUrl: './create-release.component.html',
  styleUrls: ['./create-release.component.scss'],
})
export class CreateReleaseComponent {

  isLoading$ = observableOf(false);
  paginationStateSub: Subscription;

  public cancelUrl: string;

  constructor(
    private route: ActivatedRoute,
  ) {
    const chart = this.route.snapshot.params;
    this.cancelUrl = `/monocular/charts/${chart.repo}/${chart.chartName}/${chart.version}`;
  }

}
