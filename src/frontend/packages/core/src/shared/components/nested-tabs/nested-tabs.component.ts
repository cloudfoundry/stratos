
import { ChangeDetectionStrategy, Component, Input, OnInit  } from '@angular/core';
import { RouterModule } from '@angular/router';

import { TabNavItem } from '../../../tab-nav.types';

@Component({
  selector: 'app-nested-tabs',
  templateUrl: './nested-tabs.component.html',
  styleUrls: ['./nested-tabs.component.scss'],
  standalone: true,
  imports: [
    RouterModule
],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NestedTabsComponent implements OnInit {

  @Input()
  tabs: TabNavItem[] = [];
  constructor() {

  }

  ngOnInit() { }

}
