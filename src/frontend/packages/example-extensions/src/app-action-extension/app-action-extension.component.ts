import { Component, OnInit } from '@angular/core';
import { StratosAction, StratosActionType } from '@stratosui/core';

@StratosAction({
  type: StratosActionType.Applications,
  label: 'Custom App Action',
  link: 'exampleAction',
  icon: 'extension'
})
@Component({
selector: 'app-app-action-extension',
  templateUrl: './app-action-extension.component.html',
  styleUrls: ['./app-action-extension.component.scss'],
  standalone: false
})
export class AppActionExtensionComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
