import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ListConfig } from '../../../../../../shared/components/list/list.component.types';

import { CloudFoundryCellService } from '../cloud-foundry-cell.service';
import {
  CfCellHealthListConfigService
} from '../../../../../../shared/components/list/list-types/cf-cell-health/cf-cell-health-list-config.service';
import { StratosStatus } from '../../../../../../shared/shared.types';

@Component({
  selector: 'app-cloud-foundry-cell-summary',
  templateUrl: './cloud-foundry-cell-summary.component.html',
  styleUrls: ['./cloud-foundry-cell-summary.component.scss'],
  providers: [
    {
      provide: ListConfig,
      useClass: CfCellHealthListConfigService
    }
  ]
})
export class CloudFoundryCellSummaryComponent {

  public status$: Observable<StratosStatus>;

  constructor(
    public cfCellService: CloudFoundryCellService
  ) {
    this.status$ = cfCellService.healthy$.pipe(
      map(health => {
        if (health === undefined) {
          return StratosStatus.NONE;
        }
        return health === '0' ? StratosStatus.OK : StratosStatus.ERROR;
      })
    );
  }
}
