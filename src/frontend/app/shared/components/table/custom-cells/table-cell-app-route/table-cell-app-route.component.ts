import { Component, Input, OnInit } from '@angular/core';

import { getMappedApps } from '../../../../../features/applications/routes/routes.helper';
import { TableCellCustom } from '../../table-cell/table-cell-custom';

@Component({
  selector: 'app-table-cell-app-route',
  templateUrl: './table-cell-app-route.component.html',
  styleUrls: ['./table-cell-app-route.component.scss']
})
export class TableCellAppRouteComponent<T> extends TableCellCustom<T>
  implements OnInit {
  @Input('row') row;

  mappedAppsCount = 0;
  constructor() {
    super();
  }

  ngOnInit(): void {
    this.mappedAppsCount = getMappedApps(this.row).length;
  }
}
