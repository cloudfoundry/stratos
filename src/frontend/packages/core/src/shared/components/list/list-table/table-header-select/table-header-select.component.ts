import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomCheckboxComponent } from '../../../custom-checkbox/custom-checkbox.component';

import { TableCellCustom } from '../../list.types';

@Component({
  selector: 'app-table-header-select',
  templateUrl: './table-header-select.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    CustomCheckboxComponent
  ]
})
export class TableHeaderSelectComponent<T> extends TableCellCustom<T> { }
