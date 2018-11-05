import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { CardStatus } from '../../application-state/application-state.service';


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
