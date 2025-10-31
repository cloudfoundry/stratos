import { ChangeDetectionStrategy, Component, Input} from '@angular/core';
import { ReactiveFormsModule, UntypedFormGroup } from '@angular/forms';

import { IAuthForm } from '../../../../../store/src/extension-types';
import { ShowHideButtonComponent } from '../../../../../core/src/core/show-hide-button/show-hide-button.component';
import { CustomFormFieldComponent } from '../../../../../core/src/shared/components/custom-form-field/custom-form-field.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-kubernetes-aws-auth-form',
  templateUrl: './kubernetes-aws-auth-form.component.html',
  styleUrls: ['./kubernetes-aws-auth-form.component.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CustomFormFieldComponent,
    ShowHideButtonComponent
  ]
})
export class KubernetesAWSAuthFormComponent implements IAuthForm {
  showPassword = false;
  @Input() formGroup: UntypedFormGroup;
}
