import { ChangeDetectionStrategy, Component, Input} from '@angular/core';
import { type FormControl, type FormGroup, ReactiveFormsModule, } from '@angular/forms';

import { CustomFormFieldComponent, ShowHideButtonComponent } from '@stratosui/core';
import type { IAuthForm } from '../../../../../store/src/extension-types';

interface AWSAuthForm {
  cluster: FormControl<string>;
  access_key: FormControl<string>;
  secret_key: FormControl<string>;
}

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
  @Input() formGroup: FormGroup<AWSAuthForm>;
}
