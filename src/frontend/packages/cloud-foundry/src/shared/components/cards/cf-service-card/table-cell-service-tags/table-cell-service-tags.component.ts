import { Component, Input , ChangeDetectionStrategy } from '@angular/core';
import { of } from 'rxjs';

import { AppChip, AppChipsComponent, TableCellCustom } from '@stratosui/core';
import { StServiceOffering } from '../../../../../services/endpoint-data/stratos-types';

export interface ServiceTag {
  value: string;
}

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

  tags: AppChip<ServiceTag>[] = [];

  @Input()
  set row(offering: StServiceOffering) {
    super.row = offering;
    if (!offering) {
      return;
    }
    this.tags = (offering.tags ?? []).map(t => ({
      value: t,
      hideClearButton$: of(true)
    }));
  }
  get row(): StServiceOffering {
    return super.row;
  }

}
