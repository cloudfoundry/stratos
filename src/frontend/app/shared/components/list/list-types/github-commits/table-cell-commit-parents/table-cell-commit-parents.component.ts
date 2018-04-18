import { Component, Input } from '@angular/core';

import { TableCellCustom } from '../../../list.types';

@Component({
  selector: 'app-table-cell-commit-parents',
  templateUrl: './table-cell-commit-parents.component.html',
  styleUrls: ['./table-cell-commit-parents.component.scss']
})
export class TableCellCommitParentsComponent<T> extends TableCellCustom<T> {
}
