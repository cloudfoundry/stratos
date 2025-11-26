import { Component, type OnInit } from '@angular/core';
import { PageHeaderComponent, StratosAction, StratosActionType } from '@stratosui/core';

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
  standalone: true,
  imports: [
    PageHeaderComponent
  ]
})
export class AppActionExtensionComponent implements OnInit {

  ngOnInit() {
  }

}
