import { GithubCommit } from './../../../../../store/src/types/github.types';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-github-commit-author',
  templateUrl: './github-commit-author.component.html',
  styleUrls: ['./github-commit-author.component.scss']
})
export class GithubCommitAuthorComponent {
  @Input() commit: GithubCommit;
  @Input() showAvatar = true;
}
