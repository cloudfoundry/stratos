import { DatePipe } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';

import { CardCell } from '../../../../../shared/components/list/list.types';
import { HelmRelease } from '../../workload.types';

@Component({
  selector: 'app-helm-release-card',
  templateUrl: './helm-release-card.component.html',
  styleUrls: ['./helm-release-card.component.scss']
})
export class HelmReleaseCardComponent extends CardCell<HelmRelease> implements OnInit {

  public status: string;
  public lastDeployed: string;
  private pRow: HelmRelease;

  @Input('row')
  set row(row: HelmRelease) {
    this.pRow = row;
    if (row) {
      this.status = row.status.charAt(0).toUpperCase() + row.status.substring(1);
      this.lastDeployed = this.datePipe.transform(row.info.last_deployed, 'medium');
    }
  }
  get row(): HelmRelease {
    return this.pRow;
  }


  constructor(private datePipe: DatePipe) {
    super();
  }

  ngOnInit() {
  }

}
