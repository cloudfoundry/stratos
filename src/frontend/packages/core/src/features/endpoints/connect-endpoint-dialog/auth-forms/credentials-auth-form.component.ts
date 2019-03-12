import { FormGroup } from '@angular/forms';
import { Component, Input } from '@angular/core';
import { IAuthForm } from '../../../../core/extension/extension-types';

@Component({
  selector: 'app-credentials-auth-form',
  templateUrl: './credentials-auth-form.component.html',
  styleUrls: ['./credentials-auth-form.component.scss']
})
export class CredentialsAuthFormComponent implements IAuthForm {
  @Input() formGroup: FormGroup;
}
