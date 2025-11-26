import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { CustomCheckboxComponent } from '../../../custom-checkbox/custom-checkbox.component';

import { TableCellCustom } from '../../list.types';

@Component({
  selector: 'app-table-header-select',
  templateUrl: './table-header-select.component.html',
  styleUrls: ['./table-header-select.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    CustomCheckboxComponent
  ]
})
export class TableHeaderSelectComponent<T> extends TableCellCustom<T> { }
