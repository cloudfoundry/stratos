import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { IAuthForm } from '@stratosui/store';

@Component({
  selector: 'app-sso-auth-form',
  templateUrl: './sso-auth-form.component.html',
  styleUrls: ['./sso-auth-form.component.scss']
})
export class SSOAuthFormComponent implements IAuthForm {
  @Input() formGroup: FormGroup;
}
