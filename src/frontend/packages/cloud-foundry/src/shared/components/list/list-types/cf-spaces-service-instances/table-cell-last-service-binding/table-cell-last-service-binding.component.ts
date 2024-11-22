import { Component, Input, OnInit } from '@angular/core';

import { TableCellCustom } from '../../../../../../../../core/src/shared/components/list/list.types';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { IServiceInstance } from '../../../../../../cf-api-svc.types';
import { userProvidedServiceInstanceEntityType } from '../../../../../../cf-entity-types';

@Component({
  selector: 'app-table-cell-last-service-binding',
  templateUrl: './table-cell-last-service-binding.component.html',
  styleUrls: ['./table-cell-last-service-binding.component.scss']
})
export class TableCellLastServiceBindingComponent extends TableCellCustom<APIResource<IServiceInstance>> implements OnInit {
  // tslint:disable-next-line:ban-types
  isUserProvidedServiceInstance: Boolean;


  ngOnInit() {
    this.isUserProvidedServiceInstance = this.entityKey === userProvidedServiceInstanceEntityType;
  }
}
