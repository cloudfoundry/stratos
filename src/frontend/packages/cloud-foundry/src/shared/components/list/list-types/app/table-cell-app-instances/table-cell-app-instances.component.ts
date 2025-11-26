import { Component , ChangeDetectionStrategy } from '@angular/core';

import { TableCellCustom } from '@stratosui/core';
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
