import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { BREADCRUMB_URL_PARAM, TableCellCustom } from '@stratosui/core';
import { RoutingEvent, RoutingHistoryService } from '@stratosui/store';

@Component({
  selector: 'app-table-cell-app-name',
  templateUrl: './table-cell-app-name.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ]
})
export class TableCellAppNameComponent<T> extends TableCellCustom<T> implements OnInit {
  public appLinkUrlParam$!: Observable<any>;

  private routingHistory = inject(RoutingHistoryService);

  constructor() {
    super();
  }

  ngOnInit(): void {

    this.appLinkUrlParam$ = this.routingHistory.currentState$.pipe(
      map((state: RoutingEvent | null) => {
        if (state?.url && state.url.indexOf('cloud-foundry') !== -1) {
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
