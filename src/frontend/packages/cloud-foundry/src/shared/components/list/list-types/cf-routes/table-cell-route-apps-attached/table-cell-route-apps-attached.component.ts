import { Component, Input, type OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { BehaviorSubject, combineLatest, type Observable } from 'rxjs';
import { first, map } from 'rxjs/operators';
import { type AppChip, AppChipsComponent, TableCellCustom } from '@stratosui/core';
import type { APIResource } from '@stratosui/store';
import type { CfRoute, IApp } from '@stratosui/cloud-foundry';

@Component({
  selector: 'app-table-cell-route-apps-attached',
  templateUrl: './table-cell-route-apps-attached.component.html',
  styleUrls: ['./table-cell-route-apps-attached.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    AppChipsComponent
  ]
})
export class TableCellRouteAppsAttachedComponent extends TableCellCustom<APIResource<CfRoute>> implements OnInit {
  boundApps$!: Observable<AppChip[]>;
  config$ = new BehaviorSubject<{ breadcrumbs?: string } | null>(null);
  row$ = new BehaviorSubject<APIResource<CfRoute> | null>(null);

  @Input('config')
  set config(config: { breadcrumbs?: string }) {
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
        return route.entity.apps ? route.entity.apps.map((app: APIResource<IApp>) => {
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
