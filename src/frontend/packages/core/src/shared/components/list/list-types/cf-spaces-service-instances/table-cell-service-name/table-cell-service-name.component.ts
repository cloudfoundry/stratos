import { Component, Input, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, of } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import { IServiceExtra } from '../../../../../../core/cf-api-svc.types';
import { EntityServiceFactory } from '../../../../../../core/entity-service-factory.service';
import { TableCellCustom } from '../../../list.types';
import { AppState } from '../../../../../../../../store/src/app-state';
import { getCfService } from '../../../../../../features/service-catalog/services-helper';
import { userProvidedServiceInstanceSchemaKey } from '../../../../../../../../store/src/helpers/entity-factory';

@Component({
  selector: 'app-table-cell-service-name',
  templateUrl: './table-cell-service-name.component.html',
  styleUrls: ['./table-cell-service-name.component.scss']
})
export class TableCellServiceNameComponent<T> extends TableCellCustom<T> implements OnInit {

  serviceName$: Observable<string>;
  @Input() row;
  @Input() entityKey: string;
  constructor(private store: Store<AppState>, private entityServiceFactory: EntityServiceFactory) {
    super();
  }

  ngOnInit() {
    if (this.entityKey === userProvidedServiceInstanceSchemaKey) {
      this.serviceName$ = of('User Provided');
    } else {
      this.serviceName$ = getCfService(this.row.entity.service_guid, this.row.entity.cfGuid, this.entityServiceFactory).waitForEntity$.pipe(
        filter(s => !!s),
        map(s => {
          let serviceLabel = s.entity.entity.label || 'User Provided';
          try {
            const extraInfo: IServiceExtra = s.entity.entity.extra ? JSON.parse(s.entity.entity.extra) : null;
            serviceLabel = extraInfo && extraInfo.displayName ? extraInfo.displayName : serviceLabel;
          } catch (e) { }
          return serviceLabel;
        })
      );
    }
  }
}
