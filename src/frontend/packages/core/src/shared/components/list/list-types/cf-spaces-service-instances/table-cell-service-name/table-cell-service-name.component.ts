import { Component, Input, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import { IService, IServiceExtra } from '../../../../../../core/cf-api-svc.types';
import { EntityServiceFactory } from '../../../../../../core/entity-service-factory.service';
import { TableCellCustom } from '../../../list.types';
import { AppState } from '../../../../../../../../store/src/app-state';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { serviceSchemaKey, entityFactory } from '../../../../../../../../store/src/helpers/entity-factory';
import { GetService } from '../../../../../../../../store/src/actions/service.actions';

@Component({
  selector: 'app-table-cell-service-name',
  templateUrl: './table-cell-service-name.component.html',
  styleUrls: ['./table-cell-service-name.component.scss']
})
export class TableCellServiceNameComponent<T> extends TableCellCustom<T> implements OnInit {

  serviceName$: Observable<string>;
  @Input() row;
  constructor(private store: Store<AppState>, private entityServiceFactory: EntityServiceFactory) {
    super();
  }

  ngOnInit() {
    this.serviceName$ = this.entityServiceFactory.create<APIResource<IService>>(
      serviceSchemaKey,
      entityFactory(serviceSchemaKey),
      this.row.entity.service_guid,
      new GetService(this.row.entity.service_guid, this.row.entity.cfGuid),
      false
    ).waitForEntity$.pipe(
      filter(s => !!s),
      map(s => {
        let serviceLabel = s.entity.entity.label;
        try {
          const extraInfo: IServiceExtra = s.entity.entity.extra ? JSON.parse(s.entity.entity.extra) : null;
          serviceLabel = extraInfo && extraInfo.displayName ? extraInfo.displayName : serviceLabel;
        } catch (e) { }
        return serviceLabel;
      })
    );
  }

}
