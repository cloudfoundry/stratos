import { Component, ChangeDetectionStrategy, input } from '@angular/core';

import { CodeBlockComponent } from '@stratosui/core';

import { CliCommandComponent } from './cli-command/cli-command.component';
import { CliTabCommands } from './cli-commands';

// Context used in the CLI Info template
export interface CFAppCLIInfoContext {
  appName?: string;
  spaceName: string;
  orgName: string;
  apiEndpoint: string;
  username: string;
  // The endpoint is registered with certificate validation skipped, so the
  // CLI needs the same flag to reach it.
  skipSslValidation: boolean;
  // The endpoint is registered as allowing single sign-on.
  ssoAllowed: boolean;
}

@Component({
  selector: 'app-cli-info',
  templateUrl: './cli-info.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CodeBlockComponent,
    CliCommandComponent,
  ]
})
export class CliInfoComponent {
  readonly context = input.required<CFAppCLIInfoContext>();
  // The level's commands, one section per tab, shown after Getting Started.
  readonly sections = input<CliTabCommands[]>([]);
}

