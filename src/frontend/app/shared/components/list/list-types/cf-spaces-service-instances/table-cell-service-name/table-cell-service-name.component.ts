import { Component, OnInit, Input } from '@angular/core';
import { APIResource } from '../../../../../../store/types/api.types';
import { CfServiceInstance, CfService } from '../../../../../../store/types/service.types';
import { TableCellCustom } from '../../../list-table/table-cell/table-cell-custom';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../../../store/app-state';
import { selectEntity } from '../../../../../../store/selectors/api.selectors';
import { map, filter } from 'rxjs/operators';
import { Observable } from 'rxjs/Observable';

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
    this.serviceName$ = this.store.select(selectEntity<APIResource<CfService>>('service', this.row.entity.service_guid))
      .pipe(
        filter(s => !!s),
        map(s => s.entity.label)
      );
  }

}
