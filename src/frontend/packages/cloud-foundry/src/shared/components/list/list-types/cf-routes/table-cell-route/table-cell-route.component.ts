import { Component, OnInit , ChangeDetectionStrategy } from '@angular/core';
import { TableCellCustom } from '@stratosui/core';
import { APIResource } from '@stratosui/store';
import { getRoute, isTCPRoute } from '../../../../../../features/applications/routes/routes.helper';
import { ListCfRoute } from '../cf-routes-data-source-base';

@Component({
  selector: 'app-table-cell-route',
  templateUrl: './table-cell-route.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: []
})
export class TableCellRouteComponent extends TableCellCustom<APIResource<ListCfRoute>> implements OnInit {
  routeUrl!: string;
  isRouteTCP!: boolean;

  ngOnInit() {
    const route = this.row.entity;
    if (route) {
      this.isRouteTCP = isTCPRoute(route.port);
      this.routeUrl = getRoute(route.port, route.host, route.path, !this.isRouteTCP, false, route.domain.entity.name);
    }
  }
}
