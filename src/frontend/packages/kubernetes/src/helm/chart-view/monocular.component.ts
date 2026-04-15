import {Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { PageHeaderComponent } from '@stratosui/core';

import { ChartDetailsComponent } from '../monocular/chart-details/chart-details.component';
import { ChartsService } from '../monocular/shared/services/charts.service';
import { createMonocularProviders } from '../monocular/stratos-monocular-providers.helpers';


@Component({
  selector: 'app-monocular',
  templateUrl: './monocular.component.html',

  providers: [
    ...createMonocularProviders()
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    PageHeaderComponent,
    ChartDetailsComponent
  ]
})
export class MonocularChartViewComponent implements OnInit {

  public breadcrumbs: Array<{ breadcrumbs: Array<{ value: string; routerLink?: string }> }> = [];

  public title = '';  private route = inject(ActivatedRoute);
  private chartService = inject(ChartsService);

  public ngOnInit() {

    // Set breadcrumbs
    const breadcrumbs = [
      { value: 'Helm' },
      { value: 'Charts', routerLink: '/monocular/charts' }];

    // Deconstruct the URL
    const parts = this.route.snapshot.params;
    this.title = parts.chartName;

    if (parts.version) {
      breadcrumbs.push(
        { value: this.title, routerLink: this.chartService.getChartSummaryRoute(parts.repo, parts.chartName, null, this.route) }
      );
      this.title = parts.version;
    }

    this.breadcrumbs = [{ breadcrumbs }];
  }

}
