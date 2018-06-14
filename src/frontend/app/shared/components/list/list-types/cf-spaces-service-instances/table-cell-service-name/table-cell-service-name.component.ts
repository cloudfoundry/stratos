import { Component, Input, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import { IService, IServiceExtra } from '../../../../../../core/cf-api-svc.types';
import { AppState } from '../../../../../../store/app-state';
import { selectEntity } from '../../../../../../store/selectors/api.selectors';
import { APIResource } from '../../../../../../store/types/api.types';
import { TableCellCustom } from '../../../list.types';

@Component({
  selector: 'app-table-cell-service-name',
  templateUrl: './table-cell-service-name.component.html',
  styleUrls: ['./table-cell-service-name.component.scss']
})
export class TableCellServiceNameComponent<T> extends TableCellCustom<T> implements OnInit {

  serviceName$: Observable<string>;
  @Input('row') row;
  constructor(private store: Store<AppState>) {
    super();
  }

  ngOnInit() {
    this.serviceName$ = this.store.select(selectEntity<APIResource<IService>>('service', this.row.entity.service_guid))
      .pipe(
      filter(s => !!s),
      map(s => {
        let serviceLabel = s.entity.label;
        try {
          const extraInfo: IServiceExtra = s.entity.extra ? JSON.parse(s.entity.extra) : null;
          serviceLabel = extraInfo && extraInfo.displayName ? extraInfo.displayName : serviceLabel;
        }catch (e) {}
        return serviceLabel;
      })
    );
  }

}
