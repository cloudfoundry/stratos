import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { ChartsService } from '../monocular/shared/services/charts.service';
import { createMonocularProviders } from '../monocular/stratos-monocular-providers.helpers';


@Component({
  selector: 'app-monocular',
  templateUrl: './monocular.component.html',
  styleUrls: ['./monocular.component.scss'],
  providers: [
    ...createMonocularProviders()
  ]
})
export class MonocularChartViewComponent implements OnInit {

  public breadcrumbs = [];

  public title = '';

  constructor(
    private route: ActivatedRoute,
    private chartService: ChartsService
  ) { }

  public ngOnInit() {

    // Set breadcrumbs
    const breadcrumbs = [
      { value: 'Helm' },
      { value: 'Charts', routerLink: '/monocular/charts' }];

    // Deconstruct the URL
    const parts = this.route.snapshot.params;
    this.title = parts.chartName;

    if (!!parts.version) {
      breadcrumbs.push(
        { value: this.title, routerLink: this.chartService.getChartSummaryRoute(parts.repo, parts.chartName, null, this.route) }
      );
      this.title = parts.version;
    }

    this.breadcrumbs = [{ breadcrumbs }];
  }

}
