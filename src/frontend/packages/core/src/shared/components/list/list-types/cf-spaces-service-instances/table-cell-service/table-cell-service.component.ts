import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { filter, first, map, switchMap } from 'rxjs/operators';

import { GetServiceBroker } from '../../../../../../../../store/src/actions/service-broker.actions';
import {
  entityFactory,
  serviceBrokerSchemaKey,
  userProvidedServiceInstanceSchemaKey,
} from '../../../../../../../../store/src/helpers/entity-factory';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { IServiceBroker, IServiceInstance } from '../../../../../../core/cf-api-svc.types';
import { EntityServiceFactory } from '../../../../../../core/entity-service-factory.service';
import { getCfService, getServiceName } from '../../../../../../features/service-catalog/services-helper';
import { TableCellCustom } from '../../../list.types';

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
    this.isUserProvidedServiceInstance = this.entityKey === userProvidedServiceInstanceSchemaKey;

    const service$ = getCfService(this.row.entity.service_guid, this.row.entity.cfGuid, this.entityServiceFactory).waitForEntity$.pipe(
      filter(s => !!s),
    );

    this.serviceName$ = service$.pipe(
      map(s => this.isUserProvidedServiceInstance ? 'User Provided' : getServiceName(s.entity))
    );

    this.serviceUrl$ = service$.pipe(
      map(service => `/marketplace/${service.entity.entity.cfGuid}/${service.entity.entity.guid}/summary`)
    );

    this.serviceBrokerName$ = service$.pipe(
      first(),
      switchMap(service => {
        const brokerGuid = service.entity.entity.service_broker_guid;
        return this.entityServiceFactory.create<APIResource<IServiceBroker>>(
          serviceBrokerSchemaKey,
          entityFactory(serviceBrokerSchemaKey),
          brokerGuid,
          new GetServiceBroker(
            brokerGuid,
            service.entity.entity.cfGuid
          )
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
