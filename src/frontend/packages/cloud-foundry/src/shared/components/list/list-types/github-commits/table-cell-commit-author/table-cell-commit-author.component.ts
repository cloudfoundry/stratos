import { Component } from '@angular/core';

import { TableCellCustom } from '../../../../../../../../core/src/shared/components/list/list.types';

@Component({
  selector: 'app-table-cell-commit-author',
  templateUrl: './table-cell-commit-author.component.html',
  styleUrls: ['./table-cell-commit-author.component.scss']
})
export class TableCellCommitAuthorComponent<T> extends TableCellCustom<T> { }
