import { DatePipe, TitleCasePipe } from '@angular/common';
import {Component, Input, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';

import {
  CardCell,
  MetaCardComponent,
  MetaCardItemComponent,
  MetaCardKeyComponent,
  MetaCardTitleComponent,
  MetaCardValueComponent,
  MultilineTitleComponent,
  TableCellEndpointNameComponent,
  CustomIconComponent
} from '@stratosui/core';
import type { HelmRelease } from '../../workload.types';

@Component({
  selector: 'app-helm-release-card',
  templateUrl: './helm-release-card.component.html',
  styleUrls: ['./helm-release-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    RouterModule,
    MetaCardComponent,
    MetaCardItemComponent,
    MetaCardKeyComponent,
    MetaCardTitleComponent,
    MetaCardValueComponent,
    MultilineTitleComponent,
    TableCellEndpointNameComponent,
    CustomIconComponent,
    DatePipe,
    TitleCasePipe
  ],
  providers: [DatePipe]
})
export class HelmReleaseCardComponent extends CardCell<HelmRelease> {

  public status: string;
  public lastDeployed: string;
  public icon: string;

  @Input('row')
  set row(row: HelmRelease) {
    super.row = row;
    if (row) {
      this.status = row.status.charAt(0).toUpperCase() + row.status.substring(1);
      this.lastDeployed = this.datePipe.transform(row.info.last_deployed, 'medium');
      this.icon = row.chart.metadata.icon;
      // FIXME: See #304
      // this.icon = '/pp/v1/chartsvc/v1/assets/aerospike/aerospike-enterprise/logo';
      // this.icon = 'chartsvc/v1/assets/ntppool/geoip/logo'
      // chart summary - /pp/v1/chartsvc/v1/assets/charts/aerospike/logo-160x160-fit.png
      // chart icon // https://hub.helm.sh/api/chartsvc/v1/assets/aerospike/aerospike-enterprise/logo
      // yaml url `/pp/v1/chartsvc/v1/assets/${chart.repo}/${chart.chartName}/versions/${chart.version}/values.yaml`;
    }
  }
  get row(): HelmRelease {
    return super.row;
  }  private datePipe = inject(DatePipe);

  loadImageError() {
    this.icon = null;
  }

}
