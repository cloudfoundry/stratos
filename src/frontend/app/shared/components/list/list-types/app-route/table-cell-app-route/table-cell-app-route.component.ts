import { Component, Input, OnInit } from '@angular/core';

import { ApplicationService } from '../../../../../../features/applications/application.service';
import { getMappedApps } from '../../../../../../features/applications/routes/routes.helper';
import { TableCellCustom } from '../../../list-table/table-cell/table-cell-custom';

@Component({
  selector: 'app-table-cell-app-route',
  templateUrl: './table-cell-app-route.component.html',
  styleUrls: ['./table-cell-app-route.component.scss']
})
export class TableCellAppRouteComponent<T> extends TableCellCustom<T>
  implements OnInit {
  @Input('row') row;

  mappedAppsCount: any;
  constructor(private appService: ApplicationService) {
    super();
  }

  ngOnInit(): void {
    const apps = this.row.entity.apps;
    this.mappedAppsCount = this.row.entity.mappedAppsCount;
    const foundApp =
      apps && apps.find(a => a.metadata.guid === this.appService.appGuid);
    if (foundApp && foundApp.length !== 0) {
      this.mappedAppsCount = `Already attached`;
    }
  }
}
