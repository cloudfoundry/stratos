import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-application-state',
  templateUrl: './application-state.component.html',
  styleUrls: ['./application-state.component.scss']
})
export class ApplicationStateComponent implements OnInit {

  @Input() public state: any;

  constructor() { }

  ngOnInit() {
  }

}
