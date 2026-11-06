import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

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

  private static readonly defaultLabels = {
    usernameLabel: 'Username',
    passwordLabel: 'Password'
  };

  readonly formGroup = input.required<FormGroup<CredentialsAuthForm>>();

  readonly config = input<any>({});

  // Labels for the input fields, which an auth type's config may rename. The
  // connect form passes `{}` for an auth type without a config (Metrics'
  // username and password), which must not blank the labels.
  readonly labels = computed(() => ({ ...CredentialsAuthFormComponent.defaultLabels, ...this.config() }));
}
