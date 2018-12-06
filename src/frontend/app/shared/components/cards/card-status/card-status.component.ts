import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Observable } from 'rxjs';

export enum CardStatus {
  NONE = 'none',
  OK = 'ok',
  WARNING = 'warning',
  TENTATIVE = 'tentative',
  INCOMPLETE = 'incomplete',
  ERROR = 'error',
  BUSY = 'busy'
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
