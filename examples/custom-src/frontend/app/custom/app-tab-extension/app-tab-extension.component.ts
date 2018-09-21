import { Component, OnInit } from '@angular/core';
import { StratosTab, StratosTabType, StratosAction, StratosActionType } from '../../core/extension/extension-service';

@StratosAction({
  type: StratosActionType.Applications,
  label: 'Custom App Action',
  link: 'exampleAction',
  icon: 'extension'
})
@StratosTab({
  type: StratosTabType.Application,
  label: 'Example App Tab',
  link: 'example'
})
@Component({
  selector: 'app-app-tab-extension',
  templateUrl: './app-tab-extension.component.html',
  styleUrls: ['./app-tab-extension.component.scss']
})
export class AppTabExtensionComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
