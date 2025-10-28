import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GitCommit } from '@stratosui/git';

@Component({
  selector: 'app-github-commit-author',
  templateUrl: './github-commit-author.component.html',
  styleUrls: ['./github-commit-author.component.scss'],
  standalone: true,
  imports: [
    CommonModule
  ]
})
export class GithubCommitAuthorComponent {
  @Input() commit: GitCommit;
  @Input() showAvatar = true;
}
