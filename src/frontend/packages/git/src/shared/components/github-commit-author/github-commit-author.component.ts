import { ChangeDetectionStrategy, Component, Input, input } from '@angular/core';

import { GitCommit } from '@stratosui/git';

@Component({
  selector: 'app-github-commit-author',
  templateUrl: './github-commit-author.component.html',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GithubCommitAuthorComponent {
  // strict: required @Input, always bound by the host template.
  // TODO: Skipped for migration because:
  //  This input is used in a control flow expression (e.g. `@if` or `*ngIf`)
  //  and migrating would break narrowing currently.
  @Input() commit!: GitCommit;
  readonly showAvatar = input(true);
}
