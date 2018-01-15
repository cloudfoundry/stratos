import { TableCellCustom } from '../../table-cell/table-cell-custom';
import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-table-cell-tcp-route',
  templateUrl: './table-cell-tcproute.component.html',
  styleUrls: ['./table-cell-tcproute.component.scss']
})
export class TableCellTCPRouteComponent<T> extends TableCellCustom<T> implements OnInit {

  @Input('row') row;
  isRouteTCP: boolean;
  constructor() {
    super();
  }

  isTCP = (routeEntity) => routeEntity.port !== null;

  ngOnInit() {
    this.isRouteTCP = this.isTCP(this.row.entity);
  }

}
