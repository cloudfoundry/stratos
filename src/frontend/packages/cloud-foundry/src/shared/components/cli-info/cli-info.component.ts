import { Component, Input , ChangeDetectionStrategy } from '@angular/core';

import { CodeBlockComponent } from '@stratosui/core';

// Context used in the CLI Info template
export interface CFAppCLIInfoContext {
  appName?: string;
  spaceName: string;
  orgName: string;
  apiEndpoint: string;
  username: string;
}

@Component({
  selector: 'app-cli-info',
  templateUrl: './cli-info.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CodeBlockComponent
]
})
export class CliInfoComponent {
  @Input() context!: CFAppCLIInfoContext;
}

