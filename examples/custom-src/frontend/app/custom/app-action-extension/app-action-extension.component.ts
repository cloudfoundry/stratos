import { Component, OnInit } from '@angular/core';
import { StratosTab, StratosTabType, StratosAction, StratosActionType } from '../../core/extension/extension-service';

@StratosAction({
  type: StratosActionType.Applications,
  label: 'Custom App Action',
  link: 'exampleAction',
  icon: 'extension'
})
@Component({
  selector: 'app-app-action-extension',
  templateUrl: './app-action-extension.component.html',
  styleUrls: ['./app-action-extension.component.scss']
})
export class AppActionExtensionComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
