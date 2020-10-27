import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { CFAppState } from '../../../../../../../../cloud-foundry/src/cf-app-state';
import { BREADCRUMB_URL_PARAM } from '../../../../../../../../core/src/shared/components/breadcrumbs/breadcrumbs.types';
import { TableCellCustomComponent } from '../../../../../../../../core/src/shared/components/list/list.types';
import { getCurrentRoutingState, RoutingEvent } from '../../../../../../../../store/src/types/routing.type';

@Component({
  selector: 'app-table-cell-app-name',
  templateUrl: './table-cell-app-name.component.html',
  styleUrls: ['./table-cell-app-name.component.scss']
})
export class TableCellAppNameComponent<T> extends TableCellCustomComponent<T> implements OnInit {
  public appLinkUrlParam$: Observable<any>;

  constructor(private store: Store<CFAppState>) {
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
