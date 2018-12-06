import { Component, Input } from '@angular/core';

import { GithubCommit } from '../../../store/types/github.types';

@Component({
  selector: 'app-github-commit-author',
  templateUrl: './github-commit-author.component.html',
  styleUrls: ['./github-commit-author.component.scss']
})
export class GithubCommitAuthorComponent {
  @Input() commit: GithubCommit;
  @Input() showAvatar = true;
}
