import { Component, Input } from '@angular/core';

import { CodeBlockComponent } from '../../../../../../core/src/shared/components/code-block/code-block.component';

@Component({
  selector: 'app-cli-command',
  templateUrl: './cli-command.component.html',
  styleUrls: ['./cli-command.component.scss'],
  standalone: true,
  imports: [
    CodeBlockComponent
  ]
})
export class CliCommandComponent {

  constructor() { }

  @Input() name: string;
  @Input() msg: string;
  @Input() syntax: string;

}
