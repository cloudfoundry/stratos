import { Component, Input } from '@angular/core';

import { GitCommit } from '../../../store/types/git.types';

@Component({
  selector: 'app-github-commit-author',
  templateUrl: './github-commit-author.component.html',
  styleUrls: ['./github-commit-author.component.scss']
})
export class GithubCommitAuthorComponent {
  @Input() commit: GitCommit;
  @Input() showAvatar = true;
}
