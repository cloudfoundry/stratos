import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { CFAppState } from '../../../../../../../../cloud-foundry/src/cf-app-state';
import { BREADCRUMB_URL_PARAM } from '../../../../../../../../core/src/shared/components/breadcrumbs/breadcrumbs.types';
import { TableCellCustom } from '../../../../../../../../core/src/shared/components/list/list.types';
import { getCurrentRoutingState, RoutingEvent } from '../../../../../../../../store/src/types/routing.type';

@Component({
  selector: 'app-table-cell-app-name',
  templateUrl: './table-cell-app-name.component.html',
  styleUrls: ['./table-cell-app-name.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ]
})
export class TableCellAppNameComponent<T> extends TableCellCustom<T> implements OnInit {
  public appLinkUrlParam$!: Observable<any>;

  private store = inject(Store<CFAppState>);

  constructor() {
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
