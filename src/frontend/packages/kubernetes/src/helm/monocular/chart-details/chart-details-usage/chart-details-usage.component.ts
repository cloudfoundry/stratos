import { AsyncPipe } from '@angular/common';
import {Component, Input, OnInit, ViewEncapsulation, inject, ChangeDetectionStrategy } from '@angular/core';
import { CustomTooltipDirective, MatIconRegistry } from '@stratosui/core';
import { TailwindSnackBarService } from '@stratosui/core';
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
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [AsyncPipe, CustomTooltipDirective]
})
export class ChartDetailsUsageComponent implements OnInit {
  @Input() chart: Chart;
  @Input() currentVersion: string;
  installing: boolean;
  private mdIconRegistry = inject(MatIconRegistry);
  private sanitizer = inject(DomSanitizer);
  public snackBar = inject(TailwindSnackBarService);
  public endpointsService = inject(EndpointsService);
  private route = inject(ActivatedRoute);

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
