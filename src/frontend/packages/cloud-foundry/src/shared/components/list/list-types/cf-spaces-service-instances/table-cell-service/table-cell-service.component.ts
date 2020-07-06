import { Component, Input, OnInit } from '@angular/core';
import { Observable, of } from 'rxjs';
import { filter, first, map, switchMap } from 'rxjs/operators';

import { cfEntityCatalog } from '../../../../../../../../cloud-foundry/src/cf-entity-catalog';
import { userProvidedServiceInstanceEntityType } from '../../../../../../../../cloud-foundry/src/cf-entity-types';
import { CF_ENDPOINT_TYPE } from '../../../../../../../../cloud-foundry/src/cf-types';
import { getServiceName } from '../../../../../../../../cloud-foundry/src/features/service-catalog/services-helper';
import { TableCellCustom } from '../../../../../../../../core/src/shared/components/list/list.types';
import { entityCatalog } from '../../../../../../../../store/src/entity-catalog/entity-catalog';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { IServiceInstance } from '../../../../../../cf-api-svc.types';

@Component({
  selector: 'app-table-cell-service',
  templateUrl: './table-cell-service.component.html',
  styleUrls: ['./table-cell-service.component.scss']
})
export class TableCellServiceComponent extends TableCellCustom<APIResource<IServiceInstance>> implements OnInit {

  serviceName$: Observable<string>;
  serviceUrl$: Observable<string>;
  serviceBrokerName$: Observable<string>;
  // tslint:disable-next-line:ban-types
  isUserProvidedServiceInstance: Boolean;

  @Input() row: APIResource<IServiceInstance>;
  @Input() entityKey: string;


  ngOnInit() {
    this.isUserProvidedServiceInstance =
      this.entityKey === entityCatalog.getEntityKey(CF_ENDPOINT_TYPE, userProvidedServiceInstanceEntityType);

    if (!this.isUserProvidedServiceInstance) {
      const service$ = cfEntityCatalog.service.store.getEntityService(this.row.entity.service_guid, this.row.entity.cfGuid, {})
        .waitForEntity$.pipe(
          filter(s => !!s),
        );

      this.serviceName$ = service$.pipe(
        map(s => getServiceName(s.entity))
      );

      this.serviceUrl$ = this.isUserProvidedServiceInstance ? of(null) : service$.pipe(
        map(service => `/marketplace/${service.entity.entity.cfGuid}/${service.entity.metadata.guid}/summary`)
      );

      this.serviceBrokerName$ = service$.pipe(
        first(),
        switchMap(service => {
          const brokerGuid = service.entity.entity.service_broker_guid;
          return cfEntityCatalog.serviceBroker.store.getEntityService(brokerGuid, service.entity.entity.cfGuid, {})
            .waitForEntity$.pipe(
              map(a => a.entity),
              filter(res => !!res),
              map(a => a.entity.name),
              first()
            );
        })
      );
    }
  }

}
