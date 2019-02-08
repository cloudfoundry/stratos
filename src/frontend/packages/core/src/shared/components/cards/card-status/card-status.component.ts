import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Observable } from 'rxjs';

import { CardStatus } from '../../../shared.types';


export function determineCardStatus(value: number, limit: number): CardStatus {
  if ((limit !== 0 && !limit) || limit === -1) {
    return CardStatus.NONE;
  }

  const usage = value / limit;
  // Limit can be zero, which results in infinity
  if (usage > 0.9 || usage === Infinity) {
    return CardStatus.ERROR;
  } else if (usage > 0.8) {
    return CardStatus.WARNING;
  }
  return CardStatus.NONE;
}

@Component({
  selector: 'app-card-status',
  templateUrl: './card-status.component.html',
  styleUrls: ['./card-status.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardStatusComponent {
  @Input() status$: Observable<CardStatus>;

  private cardStatus = CardStatus;

  constructor() { }
}
