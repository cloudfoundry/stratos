import { AsyncPipe } from '@angular/common';
import { Component, Input, ViewEncapsulation, inject, ChangeDetectionStrategy } from '@angular/core';
import { CustomTooltipDirective } from '@stratosui/core';
import { TailwindSnackBarService } from '@stratosui/core';
import { ActivatedRoute } from '@angular/router';

import { EndpointsService } from '../../../../../../core/src/core/endpoints.service';
import { Chart } from '../../shared/models/chart';
import { getMonocularEndpoint } from '../../stratos-monocular.helper';

@Component({
  selector: 'app-chart-details-usage',
  templateUrl: './chart-details-usage.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [AsyncPipe, CustomTooltipDirective]
})
export class ChartDetailsUsageComponent {
  @Input() chart!: Chart;
  @Input() currentVersion!: string; // strict: required @Input, only rendered inside @if (currentVersion) with a bound string
  installing!: boolean;
  public snackBar = inject(TailwindSnackBarService);
  public endpointsService = inject(EndpointsService);
  private route = inject(ActivatedRoute);

  get installUrl(): string {
    return `/workloads/install/${getMonocularEndpoint(this.route, this.chart)}/${this.chart.id}/${this.currentVersion}`;
  }

}
