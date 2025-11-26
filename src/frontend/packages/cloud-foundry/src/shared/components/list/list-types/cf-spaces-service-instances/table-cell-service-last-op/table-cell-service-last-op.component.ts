
import { Component, type OnInit , ChangeDetectionStrategy } from '@angular/core';

import { TableCellCustom } from '@stratosui/core';
import type { APIResource } from '../../../../../../../../store/src/types/api.types';
import type { IServiceInstance } from '../../../../../../cf-api-svc.types';
import { userProvidedServiceInstanceEntityType } from '../../../../../../cf-entity-types';
import { ServiceInstanceLastOpComponent } from '../../../../service-instance-last-op/service-instance-last-op.component';

@Component({
  selector: 'app-table-cell-service-last-op',
  templateUrl: './table-cell-service-last-op.component.html',
  styleUrls: ['./table-cell-service-last-op.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ServiceInstanceLastOpComponent
]
})
export class TableCellServiceLastOpComponent extends TableCellCustom<APIResource<IServiceInstance>> implements OnInit {

  // tslint:disable-next-line:ban-types
  isUserProvidedServiceInstance!: boolean;

  ngOnInit() {
    this.isUserProvidedServiceInstance = this.entityKey === userProvidedServiceInstanceEntityType;
  }
}
