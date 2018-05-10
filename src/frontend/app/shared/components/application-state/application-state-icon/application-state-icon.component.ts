import { Component, OnInit, Input } from '@angular/core';
import { CardStatus } from '../application-state.service';

@Component({
  selector: 'app-application-state-icon',
  templateUrl: './application-state-icon.component.html',
  styleUrls: ['./application-state-icon.component.scss']
})
export class ApplicationStateIconComponent implements OnInit {

  constructor() { }

  @Input() public status: CardStatus;

  ngOnInit() {
  }

}
