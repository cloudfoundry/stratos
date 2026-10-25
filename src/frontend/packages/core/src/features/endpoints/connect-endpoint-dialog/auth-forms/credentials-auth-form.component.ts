import { ChangeDetectionStrategy, Component, Input  } from '@angular/core';

import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { AppInputDirective, CustomFormFieldComponent } from '../../../../shared/components/custom-form-field/custom-form-field.component';
import { IAuthForm } from '@stratosui/store';

import { ShowHideButtonComponent } from '../../../../core/show-hide-button/show-hide-button.component';

interface CredentialsAuthForm {
  username: FormControl<string>;
  password: FormControl<string>;
}

@Component({
  selector: 'app-credentials-auth-form',
  templateUrl: './credentials-auth-form.component.html',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    AppInputDirective,
    CustomFormFieldComponent,
    ShowHideButtonComponent
],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CredentialsAuthFormComponent implements IAuthForm {

  showPassword = false;

  // Labels for the input fields, which an auth type's config may rename
  private static readonly defaultLabels = {
    usernameLabel: 'Username',
    passwordLabel: 'Password'
  };
  pConfig: any = { ...CredentialsAuthFormComponent.defaultLabels };

  @Input() formGroup!: FormGroup<CredentialsAuthForm>;

  get config(): any {
    return this.pConfig;
  }

  // The connect form passes `{}` for an auth type without a config (Metrics'
  // username and password), which must not blank the labels.
  @Input() set config(v: any) {
    this.pConfig = { ...CredentialsAuthFormComponent.defaultLabels, ...v };
  }
}
