import { Component, OnInit , ChangeDetectionStrategy } from '@angular/core';

import { TableCellCustom } from '../../../../../../../../core/src/shared/components/list/list.types';
import { UsageGaugeComponent } from '../../../../../../../../core/src/shared/components/usage-gauge/usage-gauge.component';

@Component({
  selector: 'app-table-cell-usage',
  templateUrl: './table-cell-usage.component.html',
  styleUrls: ['./table-cell-usage.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    UsageGaugeComponent
  ]
})
export class TableCellUsageComponent<T> extends TableCellCustom<T> implements OnInit {

  public value: (row: T) => string;
  public label: (row: T) => string;

  ngOnInit() {
    this.value = this.config ? this.config.value : () => '0';
    this.label = this.config ? this.config.label : () => '-';
  }

}

