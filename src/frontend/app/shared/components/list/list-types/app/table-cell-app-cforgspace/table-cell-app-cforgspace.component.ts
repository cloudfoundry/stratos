import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { AppState } from '../../../../../../store/app-state';
import { endpointSchemaKey } from '../../../../../../store/helpers/entity-factory';
import { selectEntity } from '../../../../../../store/selectors/api.selectors';
import { EndpointModel } from '../../../../../../store/types/endpoint.types';
import { TableCellAppCfOrgSpaceBase } from '../TableCellAppCfOrgSpaceBase';

@Component({
  selector: 'app-table-cell-app-cforgspace',
  templateUrl: './table-cell-app-cforgspace.component.html',
  styleUrls: ['./table-cell-app-cforgspace.component.scss'],
})
export class TableCellAppCfOrgSpaceComponent extends TableCellAppCfOrgSpaceBase implements OnInit {

  endpointName$: Observable<string>;

  constructor(private store: Store<AppState>) {
    super(store);
  }

  ngOnInit() {
    this.endpointName$ = this.store.select<EndpointModel>(selectEntity(endpointSchemaKey, this.row.entity.cfGuid)).pipe(
      map(endpoint => endpoint ? endpoint.name : '')
    );
  }
}
