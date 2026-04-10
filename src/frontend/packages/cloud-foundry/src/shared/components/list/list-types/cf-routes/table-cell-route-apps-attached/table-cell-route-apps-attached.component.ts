import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { take, map } from 'rxjs/operators';
import { AppChip, AppChipsComponent, TableCellCustom } from '@stratosui/core';
import { APIResource } from '@stratosui/store';
import { CfRoute, IApp } from '@stratosui/cloud-foundry';

@Component({
  selector: 'app-table-cell-route-apps-attached',
  templateUrl: './table-cell-route-apps-attached.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    AppChipsComponent
  ]
})
export class TableCellRouteAppsAttachedComponent extends TableCellCustom<APIResource<CfRoute>> implements OnInit {
  boundApps$!: Observable<AppChip[]>;
  config$ = new BehaviorSubject<any>(null);
  row$ = new BehaviorSubject<APIResource<CfRoute> | null>(null);

  @Input()
  set config(config: { breadcrumbs?: string }) {
    super.config = config;
    this.config$.next(config);
  }

  @Input()
  set row(route: APIResource<CfRoute>) {
    super.row = route;
    this.row$.next(route);
  }

  ngOnInit(): void {
    this.boundApps$ = combineLatest([
      this.config$.asObservable().pipe(take(1)),
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
