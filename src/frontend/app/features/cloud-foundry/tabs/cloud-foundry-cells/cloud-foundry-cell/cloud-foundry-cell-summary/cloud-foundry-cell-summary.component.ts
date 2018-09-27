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
      map(health => {
        if (health === undefined) {
          return CardStatus.NONE;
        }
        return health === '0' ? CardStatus.OK : CardStatus.ERROR;
      })
    );
  }
}
