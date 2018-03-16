import { Component, Input } from '@angular/core';

import { ISubHeaderTabs } from './page-subheader.types';

@Component({
  selector: 'app-page-subheader',
  templateUrl: './page-subheader.component.html',
  styleUrls: ['./page-subheader.component.scss']
})
export class PageSubheaderComponent {
  cssClass: string;

  @Input('tabs')
  tabs: ISubHeaderTabs[];

  @Input('nested')
  nested: boolean;

  className: string;

  constructor() {
    this.className = this.nested ? 'nested-tab' : 'page-subheader';
    if (!!this.tabs) {
      this.cssClass = this.nested ? 'nested-tab__tabs' : 'page-subheader__tabs';
    }
  }
}
