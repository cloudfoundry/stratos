import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { CardStatus } from '../../../../../../shared/components/application-state/application-state.service';
import { CloudFoundryCellService } from '../cloud-foundry-cell.service';

@Component({
  selector: 'app-cloud-foundry-cell-summary',
  templateUrl: './cloud-foundry-cell-summary.component.html',
  styleUrls: ['./cloud-foundry-cell-summary.component.scss'],
})
export class CloudFoundryCellSummaryComponent {

  public status$: Observable<CardStatus>;

  constructor(
    public cfCellService: CloudFoundryCellService
  ) {

    this.status$ = cfCellService.healthy$.pipe(
      map(entity => {
        if (!entity.data || !entity.data.result) {
          return CardStatus.NONE;
        }
        // TODO: RC
        const health = entity.data.result[0];
        return health.value[1] === '0' ? CardStatus.OK : CardStatus.ERROR;
      })
      // map(entityInfo => entityInfo.entity),
      // filter(metrics => !!metrics && !!metrics.data && !!metrics.data.result),
      // map(metrics => metrics.data.result)
    );
    // this.status$.subscribe(status => console.log(status));

    // this.status$ = cellHealth$.pipe(
    //   startWith(CardStatus.NONE)
    // );



  }
}
