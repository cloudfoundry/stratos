import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { CardStatus } from '../../application-state/application-state.service';


@Component({
  selector: 'app-card-status',
  templateUrl: './card-status.component.html',
  styleUrls: ['./card-status.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardStatusComponent {
  @Input('status$') status$: Observable<CardStatus>;

  private cardStatus = CardStatus;

  constructor() { }
}
