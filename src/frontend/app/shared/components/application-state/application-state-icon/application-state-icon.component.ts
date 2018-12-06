import { Component, Input } from '@angular/core';

import { CardStatus } from '../../cards/card-status/card-status.component';

@Component({
  selector: 'app-application-state-icon',
  templateUrl: './application-state-icon.component.html',
  styleUrls: ['./application-state-icon.component.scss']
})
export class ApplicationStateIconComponent {

  @Input() public status: CardStatus;

}
