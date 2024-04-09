import { Component, Input } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';

import { IAuthForm } from '../../../../../store/src/extension-types';

@Component({
  selector: 'app-kubernetes-serviceaccount-auth-form',
  templateUrl: './kubernetes-serviceaccount-auth-form.component.html',
  styleUrls: ['./kubernetes-serviceaccount-auth-form.component.scss']
})
export class KubernetesSATokenAuthFormComponent implements IAuthForm {
  @Input() formGroup: UntypedFormGroup;
}
