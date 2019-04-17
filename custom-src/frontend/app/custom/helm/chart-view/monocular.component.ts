import { ActivatedRoute, Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-monocular',
  templateUrl: './monocular.component.html',
  styleUrls: ['./monocular.component.scss'],
})
export class MonocularChartViewComponent implements OnInit {

  public breadcrumbs = [];

  public title = '';

  constructor(private route: ActivatedRoute) { }

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
        { value: this.title, routerLink: `/monocular/charts/${parts.repo}/${parts.chartName}` }
      );
      this.title = parts.version;
    }

    this.breadcrumbs = [{ breadcrumbs }];
  }

}
