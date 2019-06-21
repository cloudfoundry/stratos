import { Component, Input, OnInit } from '@angular/core';

import { ISubHeaderTabs } from '../page-subheader/page-subheader.types';

@Component({
  selector: 'app-nested-tabs',
  templateUrl: './nested-tabs.component.html',
  styleUrls: ['./nested-tabs.component.scss']
})
export class NestedTabsComponent implements OnInit {

  @Input()
  tabs: ISubHeaderTabs[];
  constructor() {

  }

  ngOnInit() { }

}
