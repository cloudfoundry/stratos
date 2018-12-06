import { Component, Input, OnInit } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { first, map } from 'rxjs/operators';

import { IServiceInstance } from '../../../../../../core/cf-api-svc.types';
import { APIResource } from '../../../../../../store/types/api.types';
import { AppChip } from '../../../../chips/chips.component';
import { TableCellCustom } from '../../../list.types';

@Component({
  selector: 'app-table-cell-service-instance-apps-attached',
  templateUrl: './table-cell-service-instance-apps-attached.component.html',
  styleUrls: ['./table-cell-service-instance-apps-attached.component.scss']
})
export class TableCellServiceInstanceAppsAttachedComponent extends TableCellCustom<APIResource<IServiceInstance>> implements OnInit {

  boundApps$: Observable<AppChip[]>;
  config$ = new BehaviorSubject(null);
  row$ = new BehaviorSubject(null);

  @Input('config')
  set config(config: any) {
    this.config$.next(config);
  }

  @Input('row')
  set row(row: APIResource<IServiceInstance>) {
    this.row$.next(row);
  }

  ngOnInit(): void {
    this.boundApps$ = combineLatest([
      this.config$.asObservable().pipe(first()),
      this.row$
    ]).pipe(
      map(([config, row]) => {
        return row ? row.entity.service_bindings.map(binding => {
          return {
            value: binding.entity.app.entity.name,
            url: {
              link: `/applications/${binding.entity.cfGuid}/${binding.entity.app.metadata.guid}`,
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
