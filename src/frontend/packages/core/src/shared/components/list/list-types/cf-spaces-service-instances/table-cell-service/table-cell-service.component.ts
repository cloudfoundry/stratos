import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { filter, first, map, switchMap } from 'rxjs/operators';

import {
  serviceBrokerEntityType,
  userProvidedServiceInstanceEntityType,
} from '../../../../../../../../cloud-foundry/src/cf-entity-types';
import { CF_ENDPOINT_TYPE } from '../../../../../../../../cloud-foundry/src/cf-types';
import {
  getCfService,
  getServiceName,
} from '../../../../../../../../cloud-foundry/src/features/service-catalog/services-helper';
import { entityCatalog } from '../../../../../../../../store/src/entity-catalog/entity-catalog.service';
import { EntityServiceFactory } from '../../../../../../../../store/src/entity-service-factory.service';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { IServiceBroker, IServiceInstance } from '../../../../../../core/cf-api-svc.types';
import { TableCellCustom } from '../../../list.types';

// TODO: Move CF code to CF Module #3769

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

  constructor(private entityServiceFactory: EntityServiceFactory) {
    super();
  }

  ngOnInit() {
    this.isUserProvidedServiceInstance =
      this.entityKey === entityCatalog.getEntityKey(CF_ENDPOINT_TYPE, userProvidedServiceInstanceEntityType);

    const service$ = getCfService(this.row.entity.service_guid, this.row.entity.cfGuid, this.entityServiceFactory).waitForEntity$.pipe(
      filter(s => !!s),
    );

    this.serviceName$ = service$.pipe(
      map(s => this.isUserProvidedServiceInstance ? 'User Provided' : getServiceName(s.entity))
    );

    this.serviceUrl$ = service$.pipe(
      map(service => `/marketplace/${service.entity.entity.cfGuid}/${service.entity.metadata.guid}/summary`)
    );

    this.serviceBrokerName$ = service$.pipe(
      first(),
      switchMap(service => {
        const brokerGuid = service.entity.entity.service_broker_guid;
        const serviceBrokerEntity = entityCatalog.getEntity(CF_ENDPOINT_TYPE, serviceBrokerEntityType);
        const actionBuilder = serviceBrokerEntity.actionOrchestrator.getActionBuilder('get');
        const getServiceBrokersAction = actionBuilder(brokerGuid, service.entity.entity.cfGuid);
        return this.entityServiceFactory.create<APIResource<IServiceBroker>>(
          brokerGuid,
          getServiceBrokersAction
        ).waitForEntity$.pipe(
          map(a => a.entity),
          filter(res => !!res),
          map(a => a.entity.name),
          first()
        );
      })
    );

  }

}
