import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-application-state-icon',
  templateUrl: './application-state-icon.component.html',
  styleUrls: ['./application-state-icon.component.scss']
})
export class ApplicationStateIconComponent implements OnInit {

  constructor() { }

  @Input() public state: {};

  ngOnInit() {
  }

}
