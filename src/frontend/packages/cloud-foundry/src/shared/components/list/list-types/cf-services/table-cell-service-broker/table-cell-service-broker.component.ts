import { Component, Input } from '@angular/core';
import { Observable } from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';

import { TableCellCustom } from '../../../../../../../../core/src/shared/components/list/list.types';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { IServiceBroker } from '../../../../../../cf-api-svc.types';
import { cfEntityCatalog } from '../../../../../../cf-entity-catalog';
import { IService } from '../../../../../../public_api';

export enum TableCellServiceBrokerComponentMode {
  NAME = 'NAME',
  SCOPE = 'SCOPE'
}

export interface TableCellServiceBrokerComponentConfig {
  mode: TableCellServiceBrokerComponentMode;
  altScope?: boolean;
}

@Component({
  selector: 'app-table-cell-service-broker',
  templateUrl: './table-cell-service-broker.component.html',
  styleUrls: ['./table-cell-service-broker.component.scss']
})
export class TableCellServiceBrokerComponent extends
  TableCellCustom<APIResource<IService>,
  TableCellServiceBrokerComponentConfig> {

  @Input()
  set row(row: APIResource<IService>) {
    super.row = row;
    if (row && !this.spaceLink$) {
      this.broker$ = cfEntityCatalog.serviceBroker.store.getEntityService(
        this.row.entity.service_broker_guid,
        this.row.entity.cfGuid,
        {}
      ).waitForEntity$.pipe(
        map(e => e.entity)
      );
      this.spaceLink$ = this.broker$.pipe(
        filter(broker => !!broker.entity.space_guid),
        switchMap(broker => cfEntityCatalog.space.store.getWithOrganization.getEntityService(
          broker.entity.space_guid,
          broker.entity.cfGuid
        ).waitForEntity$
        ),
        map(e => e.entity),
        map(space => ({
          name: space.entity.name,
          link: ['/cloud-foundry',
            space.entity.cfGuid,
            'organizations',
            space.entity.organization_guid,
            'spaces',
            space.metadata.guid,
            'summary'
          ]
        })
        )
      );
    }
  }
  get row(): APIResource<IService> {
    return super.row;
  }

  public spaceLink$: Observable<{
    name: string,
    link: string[],
  }>;
  public broker$: Observable<APIResource<IServiceBroker>>;

}
