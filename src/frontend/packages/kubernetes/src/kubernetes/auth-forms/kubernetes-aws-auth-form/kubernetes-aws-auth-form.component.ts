import { Component, Input } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';

import { IAuthForm } from '../../../../../store/src/extension-types';



@Component({
  selector: 'app-kubernetes-aws-auth-form',
  templateUrl: './kubernetes-aws-auth-form.component.html',
  styleUrls: ['./kubernetes-aws-auth-form.component.scss']
})
export class KubernetesAWSAuthFormComponent implements IAuthForm {
  showPassword = false;
  @Input() formGroup: UntypedFormGroup;
}
