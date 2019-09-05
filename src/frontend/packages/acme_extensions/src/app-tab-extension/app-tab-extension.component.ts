import { Component } from '@angular/core';
import { StratosTab, StratosTabType } from '@stratos/core';

@StratosTab({
  type: StratosTabType.Application,
  label: 'Example App Tab',
  link: 'example',
  icon: 'extension'
})
@Component({
  selector: 'app-app-tab-extension',
  templateUrl: './app-tab-extension.component.html',
  styleUrls: ['./app-tab-extension.component.scss']
})
export class AppTabExtensionComponent {

  constructor() { }

}
