import { Component, Input } from '@angular/core';
import { ReactiveFormsModule, UntypedFormGroup } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { IAuthForm } from '../../../../../store/src/extension-types';
import { ShowHideButtonComponent } from '../../../../../core/src/shared/components/show-hide-button/show-hide-button.component';

@Component({
  selector: 'app-kubernetes-aws-auth-form',
  templateUrl: './kubernetes-aws-auth-form.component.html',
  styleUrls: ['./kubernetes-aws-auth-form.component.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    ShowHideButtonComponent
  ]
})
export class KubernetesAWSAuthFormComponent implements IAuthForm {
  showPassword = false;
  @Input() formGroup: UntypedFormGroup;
}
