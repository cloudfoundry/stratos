import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import type { GitCommit } from '@stratosui/git';

@Component({
  selector: 'app-github-commit-author',
  templateUrl: './github-commit-author.component.html',
  styleUrls: ['./github-commit-author.component.scss'],
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GithubCommitAuthorComponent {
  @Input() commit: GitCommit;
  @Input() showAvatar = true;
}
