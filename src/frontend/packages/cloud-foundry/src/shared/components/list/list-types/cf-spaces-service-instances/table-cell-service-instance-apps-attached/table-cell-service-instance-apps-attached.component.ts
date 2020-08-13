import { Component, Input, OnInit } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable, of } from 'rxjs';
import { filter, first, map, switchMap } from 'rxjs/operators';

import { AppChip } from '../../../../../../../../core/src/shared/components/chips/chips.component';
import { TableCellCustom } from '../../../../../../../../core/src/shared/components/list/list.types';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { IServiceInstance } from '../../../../../../cf-api-svc.types';
import {
  applicationEntityType,
  serviceBindingEntityType,
  serviceInstancesEntityType,
} from '../../../../../../cf-entity-types';
import { createEntityRelationKey } from '../../../../../../entity-relations/entity-relations.types';
import { getCfServiceInstance } from '../../../../../../features/service-catalog/services-helper';

@Component({
  selector: 'app-table-cell-service-instance-apps-attached',
  templateUrl: './table-cell-service-instance-apps-attached.component.html',
  styleUrls: ['./table-cell-service-instance-apps-attached.component.scss']
})
export class TableCellServiceInstanceAppsAttachedComponent extends TableCellCustom<APIResource<IServiceInstance>> implements OnInit {

  boundApps$: Observable<AppChip[]>;
  config$ = new BehaviorSubject(null);
  row$ = new BehaviorSubject<APIResource<IServiceInstance>>(null);

  @Input('config')
  set config(config: any) {
    this.config$.next(config);
  }

  @Input('row')
  set row(row: APIResource<IServiceInstance>) {
    this.row$.next(row);
  }

  ngOnInit() {
    this.boundApps$ = combineLatest([
      this.config$.asObservable().pipe(first()),
      this.row$
    ]).pipe(
      filter(([config, row]) => !!config && !!row),
      first(),
      switchMap(([config, row]) => {
        // The row is an instance of SI... but we need to confirm that it has the SI --> binding --> app relation in place (it probably
        // won't).
        return combineLatest([
          of(config),
          getCfServiceInstance(
            row.metadata.guid,
            row.entity.cfGuid,
            [
              createEntityRelationKey(serviceInstancesEntityType, serviceBindingEntityType),
              createEntityRelationKey(serviceBindingEntityType, applicationEntityType)
            ]
          ).waitForEntity$
        ]);
      }),
      map(([config, si]) => {
        return si.entity.entity.service_bindings
          .filter(binding => !!binding.entity.app)
          .map(binding => {
            return {
              value: binding.entity.app.entity.name,
              url: {
                link: `/applications/${binding.entity.cfGuid}/${binding.entity.app.metadata.guid}`,
                params: {
                  breadcrumbs: config.breadcrumbs
                },
              }
            };
          });
      })
    );
  }

}
