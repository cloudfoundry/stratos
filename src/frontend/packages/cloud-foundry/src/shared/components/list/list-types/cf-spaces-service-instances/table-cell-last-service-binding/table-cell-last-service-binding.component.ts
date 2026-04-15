import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';

import { TableCellCustom } from '../../../../../../../../core/src/shared/components/list/list.types';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { IServiceInstance } from '../../../../../../cf-api-svc.types';
import { userProvidedServiceInstanceEntityType } from '../../../../../../cf-entity-types';
import {
  ServiceInstanceLastServiceBindingComponent,
} from '../../../../service-instance-last-service-binding/service-instance-last-service-binding.component';

@Component({
  selector: 'app-table-cell-last-service-binding',
  templateUrl: './table-cell-last-service-binding.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ServiceInstanceLastServiceBindingComponent,
  ],
})
export class TableCellLastServiceBindingComponent extends TableCellCustom<APIResource<IServiceInstance>> implements OnInit {
  isUserProvidedServiceInstance!: boolean;

  ngOnInit() {
    this.isUserProvidedServiceInstance = this.entityKey === userProvidedServiceInstanceEntityType;
  }
}
