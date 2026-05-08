import { CommonModule } from '@angular/common';
import { Component, Input, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';

import { TableCellCustom } from '@stratosui/core';
import { APIResource } from '@stratosui/store';
import { IService } from '../../../../../../cf-api-svc.types';
import { cfEntityCatalog } from '../../../../../../cf-entity-catalog';
import { ServiceCatalogDataService } from '../../../../../../services/endpoint-data/service-catalog-data.service';
import { StServiceBroker } from '../../../../../../services/endpoint-data/stratos-types';

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
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule
  ]
})
export class TableCellServiceBrokerComponent extends
  TableCellCustom<APIResource<IService>,
  TableCellServiceBrokerComponentConfig> {

  private serviceCatalog = inject(ServiceCatalogDataService);

  @Input()
  set row(row: APIResource<IService>) {
    super.row = row;
    if (row && !this.spaceLink$) {
      this.broker$ = this.serviceCatalog.serviceBroker(
        this.row.entity.cfGuid,
        this.row.entity.service_broker_guid,
      );
      // Space lookup remains on the legacy ngrx surface — out of scope
      // for this V2-cutover step. Drops the broker.entity.* wrapper for
      // the V3-flat StServiceBroker.spaceGuid / cnsiGuid shape.
      this.spaceLink$ = this.broker$.pipe(
        filter((broker): broker is StServiceBroker => !!broker && !!broker.space?.guid),
        switchMap(broker => cfEntityCatalog.space.store.getWithOrganization.getEntityService(
          broker.space!.guid,
          broker.cnsiGuid,
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
        }))
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
  public broker$: Observable<StServiceBroker | null>;

}
