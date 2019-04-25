import { Component, Input } from '@angular/core';

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
  styleUrls: ['./cli-info.component.scss']
})
export class CliInfoComponent {
  @Input() context: CFAppCLIInfoContext;
}

