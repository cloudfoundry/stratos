import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ListConfig } from '../../../../../../../../core/src/shared/components/list/list.component.types';
import { StratosStatus } from '../../../../../../../../store/src/types/shared.types';
import {
  CfCellHealthListConfigService,
} from '../../../../../../shared/components/list/list-types/cf-cell-health/cf-cell-health-list-config.service';
import { CloudFoundryCellService } from '../cloud-foundry-cell.service';

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
