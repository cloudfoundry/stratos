import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TableCellCustom } from '../../../../../../../../core/src/shared/components/list/list.types';
import { GithubCommitAuthorComponent } from '../../../../github-commit-author/github-commit-author.component';

@Component({
selector: 'app-table-cell-commit-author',
  templateUrl: './table-cell-commit-author.component.html',
  styleUrls: ['./table-cell-commit-author.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    GithubCommitAuthorComponent
  ]
})
export class TableCellCommitAuthorComponent<T> extends TableCellCustom<T> { }
