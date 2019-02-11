import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';

import { getRoute, isTCPRoute } from '../../../../../../features/applications/routes/routes.helper';
import { TableCellCustom } from '../../../list.types';
import { AppState } from '../../../../../../../../store/src/app-state';

@Component({
  selector: 'app-table-cell-route',
  templateUrl: './table-cell-route.component.html',
  styleUrls: ['./table-cell-route.component.scss']
})
export class TableCellRouteComponent<T> extends TableCellCustom<T>
  implements OnInit {
  domainSubscription: Subscription;
  @Input() row;
  routeUrl: string;
  isRouteTCP: boolean;
  constructor(private store: Store<AppState>) {
    super();
  }

  ngOnInit() {
    if (this.row && this.row.entity) {
      this.routeUrl = getRoute(this.row.entity.port, this.row.entity.host, this.row.entity.path, false, false, this.row.entity.path);
      this.isRouteTCP = isTCPRoute(this.row);
    } else {
      this.routeUrl = '-';
      this.isRouteTCP = false;
    }

  }
}
