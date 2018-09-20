import { Component, Input } from '@angular/core';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';

import { APIResource } from '../../../../../../store/types/api.types';
import { CfRoute } from '../../../../../../store/types/route.types';
import { AppChip } from '../../../../chips/chips.component';
import { first, map } from 'rxjs/operators';

@Component({
  selector: 'app-table-cell-route-apps-attached',
  templateUrl: './table-cell-route-apps-attached.component.html',
  styleUrls: ['./table-cell-route-apps-attached.component.scss']
})
export class TableCellRouteAppsAttachedComponent {
  boundApps$: Observable<AppChip[]>;
  config$ = new BehaviorSubject(null);
  row$ = new BehaviorSubject(null);

  @Input('config')
  set config(config: any) {
    this.config$.next(config);
  }

  @Input('row')
  set row(route: APIResource<CfRoute>) {
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
                breadcrumbs: config.breadcrumbs
              },
            }
          };
        }) : [];
      }),
      first()
    );
  }
}
