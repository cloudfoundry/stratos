import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { TableCellAppCfOrgSpaceBase } from '../TableCellAppCfOrgSpaceBase';
import { AppState } from '../../../../../../../../store/src/app-state';
import { EndpointModel } from '../../../../../../../../store/src/types/endpoint.types';
import { selectEntity } from '../../../../../../../../store/src/selectors/api.selectors';
import { endpointSchemaKey } from '../../../../../../../../store/src/helpers/entity-factory';

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
