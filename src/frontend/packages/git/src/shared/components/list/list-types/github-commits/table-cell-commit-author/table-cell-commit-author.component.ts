import { ChangeDetectionStrategy, Component } from '@angular/core';


import { TableCellCustom } from '../../../../../../../../core/src/shared/components/list/list.types';
import { GithubCommitAuthorComponent } from '../../../../github-commit-author/github-commit-author.component';

@Component({
selector: 'app-table-cell-commit-author',
  templateUrl: './table-cell-commit-author.component.html',
  standalone: true,
  imports: [
    GithubCommitAuthorComponent
],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableCellCommitAuthorComponent<T> extends TableCellCustom<T> { }
