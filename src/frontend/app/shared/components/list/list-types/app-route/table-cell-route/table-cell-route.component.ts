import { TableCellCustom } from '../../../list-table/table-cell/table-cell-custom';
import { Component, OnInit, Input } from '@angular/core';
import { isTCPRoute, getRoute } from '../../../../../../features/applications/routes/routes.helper';
@Component({
  selector: 'app-table-cell-route',
  templateUrl: './table-cell-route.component.html',
  styleUrls: ['./table-cell-route.component.scss']
})
export class TableCellRouteComponent<T> extends TableCellCustom<T>
  implements OnInit, OnDestroy {
  domainSubscription: Subscription;
  @Input('row') row;
  routeUrl: string;
  isRouteTCP: boolean;
  constructor(private store: Store<AppState>) {
    super();
  }

  ngOnInit() {
    this.domainSubscription = this.store
      .select(selectEntity<EntityInfo>('domain', this.row.entity.domain_guid))
      .pipe(
        filter(p => !!p),
        tap(domain => {
          this.routeUrl = getRoute(this.row, false, false, domain);
          this.isRouteTCP = isTCPRoute(this.row);
        })
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.domainSubscription.unsubscribe();
  }
}
