import { Component, Input, OnInit , ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BehaviorSubject, combineLatest, Observable, of } from 'rxjs';
import { take, filter, map, switchMap } from 'rxjs/operators';

import { AppChipsComponent, AppChip } from '../../../../../../../../core/src/shared/components/chips/chips.component';
import { TableCellCustom } from '../../../../../../../../core/src/shared/components/list/list.types';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { IServiceInstance } from '../../../../../../cf-api-svc.types';
import {
  applicationEntityType,
  serviceBindingEntityType,
  serviceInstancesEntityType } from '../../../../../../cf-entity-types';
import { createEntityRelationKey } from '../../../../../../entity-relations/entity-relations.types';
import { getCfServiceInstance } from '../../../../../../features/service-catalog/services-helper';

@Component({
  selector: 'app-table-cell-service-instance-apps-attached',
  templateUrl: './table-cell-service-instance-apps-attached.component.html',
  styleUrls: ['./table-cell-service-instance-apps-attached.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    AppChipsComponent
  ]
})
export class TableCellServiceInstanceAppsAttachedComponent
  extends TableCellCustom<APIResource<IServiceInstance>>
  implements OnInit {

  boundApps$!: Observable<AppChip[]>;
  config$ = new BehaviorSubject<any>(null);
  row$ = new BehaviorSubject<APIResource<IServiceInstance> | null>(null);

  @Input()
  set config(config: any) {
    super.config = config;
    this.config$.next(config);
  }

  @Input()
  set row(row: APIResource<IServiceInstance>) {
    super.row = row;
    this.row$.next(row);
  }

  ngOnInit() {
    this.boundApps$ = combineLatest([
      this.config$.asObservable().pipe(take(1)),
      this.row$
    ]).pipe(
      filter(([config, row]) => !!config && !!row),
      take(1),
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
                } }
            };
          });
      })
    );
  }

}
