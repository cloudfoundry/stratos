import { Component, Input, OnInit } from '@angular/core';
import { Observable, of } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import { cfEntityCatalog } from '../../../../../../../../cloud-foundry/src/cf-entity-catalog';
import { userProvidedServiceInstanceEntityType } from '../../../../../../../../cloud-foundry/src/cf-entity-types';
import { CF_ENDPOINT_TYPE } from '../../../../../../../../cloud-foundry/src/cf-types';
import { getServiceName } from '../../../../../../../../cloud-foundry/src/features/service-catalog/services-helper';
import { TableCellCustom } from '../../../../../../../../core/src/shared/components/list/list.types';
import { entityCatalog } from '../../../../../../../../store/src/entity-catalog/entity-catalog';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { IService, IServiceInstance } from '../../../../../../cf-api-svc.types';
import {
  TableCellServiceBrokerComponentConfig,
  TableCellServiceBrokerComponentMode,
} from '../../cf-services/table-cell-service-broker/table-cell-service-broker.component';

@Component({
  selector: 'app-table-cell-service',
  templateUrl: './table-cell-service.component.html',
  styleUrls: ['./table-cell-service.component.scss']
})
export class TableCellServiceComponent extends TableCellCustom<APIResource<IServiceInstance>> implements OnInit {

  serviceName$: Observable<string>;
  serviceUrl$: Observable<string>;
  service$: Observable<APIResource<IService>>;
  // tslint:disable-next-line:ban-types
  isUserProvidedServiceInstance: Boolean;

  @Input() row: APIResource<IServiceInstance>;
  @Input() entityKey: string;

  brokerNameConfig: TableCellServiceBrokerComponentConfig = {
    mode: TableCellServiceBrokerComponentMode.NAME
  }
  brokerScopeConfig: TableCellServiceBrokerComponentConfig = {
    mode: TableCellServiceBrokerComponentMode.SCOPE,
    altScope: true
  }


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

      this.service$ = service$.pipe(
        filter(res => !!res),
        map(a => a.entity),
      );
    }
  }

}
