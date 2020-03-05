import { DatePipe } from '@angular/common';
import { Component, Input } from '@angular/core';

import { CardCell } from '../../../../../shared/components/list/list.types';
import { HelmRelease } from '../../workload.types';

@Component({
  selector: 'app-helm-release-card',
  templateUrl: './helm-release-card.component.html',
  styleUrls: ['./helm-release-card.component.scss']
})
export class HelmReleaseCardComponent extends CardCell<HelmRelease> {

  public status: string;
  public lastDeployed: string;
  private pRow: HelmRelease;
  public icon: string;

  @Input('row')
  set row(row: HelmRelease) {
    this.pRow = row;
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
    return this.pRow;
  }


  constructor(private datePipe: DatePipe) {
    super();
  }

  loadImageError() {
    this.icon = null;
  }

}
