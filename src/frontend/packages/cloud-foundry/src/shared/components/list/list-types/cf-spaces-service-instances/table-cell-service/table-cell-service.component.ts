import { Component, OnInit, ChangeDetectionStrategy, Injector, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { userProvidedServiceInstanceEntityType } from '../../../../../../../../cloud-foundry/src/cf-entity-types';
import { CF_ENDPOINT_TYPE } from '../../../../../../../../cloud-foundry/src/cf-types';
import { ServiceCatalogDataService } from '../../../../../../services/endpoint-data/service-catalog-data.service';
import { StServiceOffering } from '../../../../../../services/endpoint-data/stratos-types';
import { TableCellCustom } from '../../../../../../../../core/src/shared/components/list/list.types';
import { entityCatalog } from '../../../../../../../../store/src/entity-catalog/entity-catalog';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { IServiceInstance } from '../../../../../../cf-api-svc.types';
import {
  TableCellServiceBrokerComponent,
  TableCellServiceBrokerComponentConfig,
  TableCellServiceBrokerComponentMode,
} from '../../cf-services/table-cell-service-broker/table-cell-service-broker.component';

@Component({
  selector: 'app-table-cell-service',
  templateUrl: './table-cell-service.component.html',
  styleUrls: ['./table-cell-service.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    TableCellServiceBrokerComponent
  ]
})
export class TableCellServiceComponent extends TableCellCustom<APIResource<IServiceInstance>> implements OnInit {

  private serviceCatalog = inject(ServiceCatalogDataService);
  private injector = inject(Injector);

  serviceName$!: Observable<string>;
  serviceUrl$!: Observable<string>;
  service$!: Observable<StServiceOffering | null>;
  isUserProvidedServiceInstance!: boolean;

  brokerNameConfig: TableCellServiceBrokerComponentConfig = {
    mode: TableCellServiceBrokerComponentMode.NAME
  };
  brokerScopeConfig: TableCellServiceBrokerComponentConfig = {
    mode: TableCellServiceBrokerComponentMode.SCOPE,
    altScope: true
  };

  ngOnInit() {
    this.isUserProvidedServiceInstance =
      this.entityKey === entityCatalog.getEntityKey(CF_ENDPOINT_TYPE, userProvidedServiceInstanceEntityType);

    if (this.isUserProvidedServiceInstance) {
      this.serviceName$ = of('');
      this.serviceUrl$ = of(null);
      this.service$ = of(null);
      return;
    }

    const cfGuid = this.row.entity.cfGuid;
    const serviceGuid = this.row.entity.service_guid;
    const source = this.serviceCatalog.serviceOffering(cfGuid, serviceGuid);
    const offering$ = toObservable(source.value, { injector: this.injector });

    this.service$ = offering$;

    // displayName from brokerCatalogMetadata is the broker's preferred
    // label; fall back to the offering's bare name. Empty string while
    // the source is still loading so the template renders blank rather
    // than 'null'.
    this.serviceName$ = offering$.pipe(map(o => {
      if (!o) return '';
      const dn = o.brokerCatalogMetadata?.displayName;
      return typeof dn === 'string' && dn ? dn : o.name;
    }));

    this.serviceUrl$ = offering$.pipe(map(o =>
      o ? `/marketplace/${o.cnsiGuid}/${o.guid}/summary` : `/marketplace/${cfGuid}/${serviceGuid}/summary`
    ));
  }
}
