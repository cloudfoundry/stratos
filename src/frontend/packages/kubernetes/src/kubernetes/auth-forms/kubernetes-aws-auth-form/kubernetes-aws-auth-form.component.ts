import { ChangeDetectionStrategy, Component, Input} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { IAuthForm } from '../../../../../store/src/extension-types';
import { ShowHideButtonComponent } from '../../../../../core/src/core/show-hide-button/show-hide-button.component';
import { AppInputDirective, CustomFormFieldComponent } from '../../../../../core/src/shared/components/custom-form-field/custom-form-field.component';

interface AWSAuthForm {
  cluster: FormControl<string>;
  access_key: FormControl<string>;
  secret_key: FormControl<string>;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-kubernetes-aws-auth-form',
  templateUrl: './kubernetes-aws-auth-form.component.html',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    AppInputDirective,
    CustomFormFieldComponent,
    ShowHideButtonComponent
  ]
})
export class KubernetesAWSAuthFormComponent implements IAuthForm {
  showPassword = false;
  @Input() formGroup!: FormGroup<AWSAuthForm>; // strict: required @Input (IAuthForm contract), assigned by the auth-form host
}
