import { Component, ChangeDetectionStrategy, computed } from '@angular/core';
import { of } from 'rxjs';

import { AppChip, AppChipsComponent, TableCellCustom } from '@stratosui/core';
import { StServiceOffering } from '../../../../../services/endpoint-data/stratos-types';

@Component({
  selector: 'app-table-cell-service-tags',
  templateUrl: './table-cell-service-tags.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AppChipsComponent
  ]
})
export class TableCellServiceTagsComponent extends TableCellCustom<StServiceOffering> {

  // Plain string-keyed chips — the cell only sets `value`/`hideClearButton$`
  readonly tags = computed<AppChip[]>(() => (this.row()?.tags ?? []).map(t => ({
    value: t,
    hideClearButton$: of(true)
  })));

}
