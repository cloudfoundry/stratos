import { Component, ChangeDetectionStrategy, input } from '@angular/core';

import { CodeBlockComponent } from '@stratosui/core';

@Component({
  selector: 'app-cli-command',
  templateUrl: './cli-command.component.html',
  styleUrls: ['./cli-command.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CodeBlockComponent
  ]
})
export class CliCommandComponent {

  constructor() { }

  readonly name = input<string>();
  readonly msg = input<string>();
  readonly syntax = input<string>();

}
