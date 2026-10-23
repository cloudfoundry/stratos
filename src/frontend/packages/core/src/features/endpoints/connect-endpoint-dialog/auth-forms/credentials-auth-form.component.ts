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

  // Custom labels for the input fields
  pConfig: any = {
    usernameLabel: 'Username',
    passwordLabel: 'Password'
  };

  // TODO: Skipped for migration because:
  //  This input overrides a field from a superclass, while the superclass field
  //  is not migrated.
  @Input() formGroup!: FormGroup<CredentialsAuthForm>;

  get config(): any {
    return this.pConfig;
  }

  // TODO: Skipped for migration because:
  //  Accessor inputs cannot be migrated as they are too complex.
  @Input() set config(v: any) {
    if (v) {
      this.pConfig = v;
    }
  }
}
