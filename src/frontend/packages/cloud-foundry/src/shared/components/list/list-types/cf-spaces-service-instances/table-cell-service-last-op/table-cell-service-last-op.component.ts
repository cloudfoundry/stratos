import { Component, OnInit } from '@angular/core';

import { TableCellCustomComponent } from '../../../../../../../../core/src/shared/components/list/list.types';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { IServiceInstance } from '../../../../../../cf-api-svc.types';
import { userProvidedServiceInstanceEntityType } from '../../../../../../cf-entity-types';

@Component({
  selector: 'app-table-cell-service-last-op',
  templateUrl: './table-cell-service-last-op.component.html',
  styleUrls: ['./table-cell-service-last-op.component.scss']
})
export class TableCellServiceLastOpComponent extends TableCellCustomComponent<APIResource<IServiceInstance>> implements OnInit {

  // tslint:disable-next-line:ban-types
  isUserProvidedServiceInstance: Boolean;

  ngOnInit() {
    this.isUserProvidedServiceInstance = this.entityKey === userProvidedServiceInstanceEntityType;
  }
}
