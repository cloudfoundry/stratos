import { ChangeDetectionStrategy, Component, Input  } from '@angular/core';

import { ReactiveFormsModule, type FormGroup, type FormControl, } from '@angular/forms';
import { CustomFormFieldComponent, MatSuffixDirective } from '../../../../shared/components/custom-form-field/custom-form-field.component';
import type { IAuthForm } from '@stratosui/store';

import { ShowHideButtonComponent } from '../../../../core/show-hide-button/show-hide-button.component';

interface CredentialsAuthForm {
  username: FormControl<string>;
  password: FormControl<string>;
}

@Component({
  selector: 'app-credentials-auth-form',
  templateUrl: './credentials-auth-form.component.html',
  styleUrls: ['./credentials-auth-form.component.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatSuffixDirective,
    CustomFormFieldComponent,
    ShowHideButtonComponent
],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CredentialsAuthFormComponent implements IAuthForm {

  showPassword = false;

  // Custom labels for the input fields
  pConfig: Record<string, string> = {
    usernameLabel: 'Username',
    passwordLabel: 'Password'
  };

  @Input() formGroup!: FormGroup<CredentialsAuthForm>;

  get config(): Record<string, string> {
    return this.pConfig;
  }

  @Input() set config(v: Record<string, string>) {
    if (v) {
      this.pConfig = v;
    }
  }
}
