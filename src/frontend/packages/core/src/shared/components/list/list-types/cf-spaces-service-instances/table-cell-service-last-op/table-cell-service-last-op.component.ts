import { Component, Input, OnInit } from '@angular/core';

import { userProvidedServiceInstanceSchemaKey } from '../../../../../../../../store/src/helpers/entity-factory';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { IServiceInstance } from '../../../../../../core/cf-api-svc.types';
import { TableCellCustom } from '../../../list.types';

@Component({
  selector: 'app-table-cell-service-last-op',
  templateUrl: './table-cell-service-last-op.component.html',
  styleUrls: ['./table-cell-service-last-op.component.scss']
})
export class TableCellServiceLastOpComponent extends TableCellCustom<APIResource<IServiceInstance>> implements OnInit {

  @Input() row;
  @Input() entityKey: string;
  // tslint:disable-next-line:ban-types
  isUserProvidedServiceInstance: Boolean;

  constructor() {
    super();
  }

  ngOnInit() {
    this.isUserProvidedServiceInstance = this.entityKey === userProvidedServiceInstanceSchemaKey;
  }
}
