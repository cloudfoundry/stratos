import { Component, Input } from '@angular/core';
import { EndpointAuthComponent } from '../../endpoint-helpers';

@Component({
  selector: 'app-sso-auth-form',
  templateUrl: './sso-auth-form.component.html',
  styleUrls: ['./sso-auth-form.component.scss']
})
export class SSOAuthFormComponent implements EndpointAuthComponent {
  getBody(): string {
    return 'Method not implemented';
  }

  @Input() formGroup;

}
