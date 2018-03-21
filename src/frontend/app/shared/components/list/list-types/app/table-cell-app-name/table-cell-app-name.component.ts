import { Component, OnInit } from '@angular/core';
import { TableCellCustom } from '../../../list-table/table-cell/table-cell-custom';
import { BREADCRUMB_URL_PARAM } from '../../../../page-header/page-header.types';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../../../store/app-state';
import { getCurrentRoutingState, RoutingHistory, RoutingEvent } from '../../../../../../store/types/routing.type';
import { Observable } from 'rxjs/Observable';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-table-cell-app-name',
  templateUrl: './table-cell-app-name.component.html',
  styleUrls: ['./table-cell-app-name.component.scss']
})
export class TableCellAppNameComponent<T> extends TableCellCustom<T> implements OnInit {
  public appLinkUrlParam$: Observable<any>;

  constructor(private store: Store<AppState>) {
    super();
  }

  ngOnInit(): void {

    this.appLinkUrlParam$ = this.store.select(getCurrentRoutingState).pipe(
      map((state: RoutingEvent) => {
        if (state.url.indexOf('cloud-foundry') !== -1) {
          // We're in the Cloud Foundry section, change the breadcrumb
          return {
            [BREADCRUMB_URL_PARAM]: 'space'
          };
        }
        // Default breadcrumb is apps/appName
        return {};
      })
    );
  }
}
