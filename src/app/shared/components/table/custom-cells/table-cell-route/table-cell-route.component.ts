import { TableCellCustom } from '../../table-cell/table-cell-custom';
import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-table-cell-route',
  templateUrl: './table-cell-route.component.html',
  styleUrls: ['./table-cell-route.component.scss']
})
export class TableCellRouteComponent<T> extends TableCellCustom<T> implements OnInit {

  @Input('row') row;
  routeUrl: string;
  isRouteTCP: boolean;
  constructor() {
    super();
   }

   getRoute = (routeEntity) => {

    if (!routeEntity) {
      return;
    }
    if (routeEntity.port) {
      // Note: Hostname and path are not supported for TCP routes
      return `${routeEntity.domain && routeEntity.domain.entity.name}:${routeEntity.port}`;
    } else if (routeEntity.path) {
      return `${routeEntity.host}.${routeEntity.domain && routeEntity.domain.entity.name}/${routeEntity.path}`;
    } else {
      return `${routeEntity.host}.${routeEntity.domain && routeEntity.domain.entity.name}`;
    }
  }

  isTCP = (routeEntity) => routeEntity.port !== null;

  ngOnInit() {
    this.routeUrl = this.getRoute(this.row.entity);
    this.isRouteTCP = this.isTCP(this.row.entity);
  }
}
