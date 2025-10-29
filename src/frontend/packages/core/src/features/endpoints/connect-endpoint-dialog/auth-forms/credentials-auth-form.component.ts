import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, UntypedFormGroup } from '@angular/forms';
import { CustomFormFieldComponent } from '../../../../shared/components/custom-form-field/custom-form-field.component';
import { MatInputModule } from '@angular/material/input';
import { IAuthForm } from '@stratosui/store';

import { ShowHideButtonComponent } from '../../../../core/show-hide-button/show-hide-button.component';

@Component({
  selector: 'app-credentials-auth-form',
  templateUrl: './credentials-auth-form.component.html',
  styleUrls: ['./credentials-auth-form.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CustomFormFieldComponent,
    MatInputModule,
    ShowHideButtonComponent
  ]
})
export class CredentialsAuthFormComponent implements IAuthForm {

  showPassword = false;

  // Custom labels for the input fields
  pConfig: any = {
    usernameLabel: 'Username',
    passwordLabel: 'Password'
  };

  @Input() formGroup: UntypedFormGroup;

  get config(): any {
    return this.pConfig;
  }

  @Input() set config(v: any) {
    if (v) {
      this.pConfig = v;
    }
  }
}
