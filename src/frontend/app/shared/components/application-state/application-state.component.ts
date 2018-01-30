import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-application-state',
  templateUrl: './application-state.component.html',
  styleUrls: ['./application-state.component.scss']
})
export class ApplicationStateComponent implements OnInit {

  @Input('state')
  public state: any;

  @Input('hideIcon')
  public hideIcon: boolean;

  constructor() { }

  ngOnInit() {
  }

}
