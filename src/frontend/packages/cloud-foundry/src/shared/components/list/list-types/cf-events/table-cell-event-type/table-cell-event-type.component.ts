import { Component } from '@angular/core';

import { TableCellCustomComponent } from '../../../../../../../../core/src/shared/components/list/list.types';

/* tslint:disable:no-access-missing-member https://github.com/mgechev/codelyzer/issues/191*/
@Component({
  selector: 'app-table-cell-event-type',
  templateUrl: './table-cell-event-type.component.html',
  styleUrls: ['./table-cell-event-type.component.scss']
})
export class TableCellEventTypeComponent<T> extends TableCellCustomComponent<T> { }
