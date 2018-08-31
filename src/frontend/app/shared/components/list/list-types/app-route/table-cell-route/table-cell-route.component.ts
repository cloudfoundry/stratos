import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { filter, tap } from 'rxjs/operators';
import { Subscription } from 'rxjs';

import { getRoute, isTCPRoute } from '../../../../../../features/applications/routes/routes.helper';
import { AppState } from '../../../../../../store/app-state';
import { selectEntity } from '../../../../../../store/selectors/api.selectors';
import { EntityInfo } from '../../../../../../store/types/api.types';
import { TableCellCustom } from '../../../list.types';

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
    const domain = this.row && this.row.entity ? this.row.entity.domain : null;
    this.routeUrl = getRoute(this.row, false, false, domain);
    this.isRouteTCP = isTCPRoute(this.row);
  }
}
