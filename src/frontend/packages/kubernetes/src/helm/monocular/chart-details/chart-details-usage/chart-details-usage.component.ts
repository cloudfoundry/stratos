import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';

import { EndpointsService } from '../../../../../../core/src/core/endpoints.service';
import { Chart } from '../../shared/models/chart';
import { getMonocularEndpoint } from '../../stratos-monocular.helper';

@Component({
  selector: 'app-chart-details-usage',
  templateUrl: './chart-details-usage.component.html',
  styleUrls: ['./chart-details-usage.component.scss'],
  viewProviders: [MatIconRegistry],
  encapsulation: ViewEncapsulation.None
})
export class ChartDetailsUsageComponent implements OnInit {
  @Input() chart: Chart;
  @Input() currentVersion: string;
  installing: boolean;

  constructor(
    private mdIconRegistry: MatIconRegistry,
    private sanitizer: DomSanitizer,
    public snackBar: MatSnackBar,
    public endpointsService: EndpointsService,
    private route: ActivatedRoute,
  ) { }

  ngOnInit() {
    this.mdIconRegistry.addSvgIcon(
      'content-copy',
      this.sanitizer.bypassSecurityTrustResourceUrl(
        // TODO: See #150 - content-copy.svg doesn't exist
        '/assets/icons/content-copy.svg'
      )
    );
  }

  get installUrl(): string {
    return `/workloads/install/${getMonocularEndpoint(this.route, this.chart)}/${this.chart.id}/${this.currentVersion}`;
  }

}
