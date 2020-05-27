import { Component, OnInit } from '@angular/core';
import { StratosTab, StratosTabType } from '@stratosui/core';

@StratosTab({
  icon: 'extension',
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
