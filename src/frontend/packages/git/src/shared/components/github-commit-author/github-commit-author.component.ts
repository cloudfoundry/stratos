import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

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
  @Input() commit!: GitCommit;
  @Input() showAvatar = true;
}
