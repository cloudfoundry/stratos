import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Observable } from 'rxjs';

import { StratosStatus } from '../../../../../../store/src/types/shared.types';


export function determineCardStatus(value: number, limit: number): StratosStatus {
  if ((limit !== 0 && !limit) || limit === -1) {
    return StratosStatus.NONE;
  }

  const usage = value / limit;
  // Limit can be zero, which results in infinity
  if (usage > 0.9 || usage === Infinity) {
    return StratosStatus.ERROR;
  } else if (usage > 0.8) {
    return StratosStatus.WARNING;
  }
  return StratosStatus.NONE;
}

@Component({
  selector: 'app-card-status',
  templateUrl: './card-status.component.html',
  styleUrls: ['./card-status.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardStatusComponent {
  @Input() status$: Observable<StratosStatus>;

  private cardStatus = StratosStatus;

  constructor() { }
}
