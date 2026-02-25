import { Component , ChangeDetectionStrategy } from '@angular/core';

import { TableCellCustom } from '../../../../../../../../core/src/shared/components/list/list.types';
import { RunningInstancesComponent } from '../../../../running-instances/running-instances.component';

@Component({
  selector: 'app-table-cell-app-instances',
  templateUrl: './table-cell-app-instances.component.html',
  styleUrls: ['./table-cell-app-instances.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RunningInstancesComponent
  ]
})
export class TableCellAppInstancesComponent<T> extends TableCellCustom<T> { }
