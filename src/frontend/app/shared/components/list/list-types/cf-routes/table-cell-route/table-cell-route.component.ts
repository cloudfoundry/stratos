import { Component, OnInit } from '@angular/core';

import { getRoute, isTCPRoute } from '../../../../../../features/applications/routes/routes.helper';
import { APIResource } from '../../../../../../store/types/api.types';
import { TableCellCustom } from '../../../list.types';
import { ListCfRoute } from '../cf-routes-data-source-base';

@Component({
  selector: 'app-table-cell-route',
  templateUrl: './table-cell-route.component.html',
  styleUrls: ['./table-cell-route.component.scss']
})
export class TableCellRouteComponent extends TableCellCustom<APIResource<ListCfRoute>> implements OnInit {
  routeUrl: string;
  isRouteTCP: boolean;

  ngOnInit() {
    const route = this.row.entity;
    if (route) {
      this.isRouteTCP = isTCPRoute(route.port);
      this.routeUrl = getRoute(route.port, route.host, route.path, !this.isRouteTCP, false, route.domain.entity.name);
    }
  }
}
