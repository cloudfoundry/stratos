import { Component, Input } from '@angular/core';
import { IAuthForm } from '../../../../core/extension/extension-types';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-sso-auth-form',
  templateUrl: './sso-auth-form.component.html',
  styleUrls: ['./sso-auth-form.component.scss']
})
export class SSOAuthFormComponent implements IAuthForm {
  @Input() formGroup: FormGroup;
}
