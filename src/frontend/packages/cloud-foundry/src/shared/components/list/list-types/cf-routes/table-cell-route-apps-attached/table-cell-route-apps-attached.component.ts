import { Component, Input, OnInit } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { first, map } from 'rxjs/operators';

import { CfRoute } from '../../../../../../../../cloud-foundry/src/store/types/route.types';
import { AppChip } from '../../../../../../../../core/src/shared/components/chips/chips.component';
import { TableCellCustom } from '../../../../../../../../core/src/shared/components/list/list.types';
import { APIResource } from '../../../../../../../../store/src/types/api.types';

@Component({
  selector: 'app-table-cell-route-apps-attached',
  templateUrl: './table-cell-route-apps-attached.component.html',
  styleUrls: ['./table-cell-route-apps-attached.component.scss']
})
export class TableCellRouteAppsAttachedComponent extends TableCellCustom<any> implements OnInit {
  boundApps$: Observable<AppChip[]>;
  config$ = new BehaviorSubject(null);
  row$ = new BehaviorSubject(null);

  @Input('config')
  set config(config: any) {
    super.config = config;
    this.config$.next(config);
  }

  @Input('row')
  set row(route: APIResource<CfRoute>) {
    super.row = route;
    this.row$.next(route);
  }

  ngOnInit(): void {
    this.boundApps$ = combineLatest([
      this.config$.asObservable().pipe(first()),
      this.row$
    ]).pipe(
      map(([config, route]) => {
        return route.entity.apps ? route.entity.apps.map(app => {
          return {
            value: app.entity.name,
            url: {
              link: `/applications/${app.entity.cfGuid}/${app.metadata.guid}`,
              params: {
                breadcrumbs: config ? config.breadcrumbs : null
              },
            }
          };
        }) : [];
      })
    );
  }
}
