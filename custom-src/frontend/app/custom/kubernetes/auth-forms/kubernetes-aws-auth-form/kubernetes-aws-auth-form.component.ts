import { Component, OnInit, Input } from '@angular/core';
import { IAuthForm } from '../../../../core/extension/extension-types';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-kubernetes-aws-auth-form',
  templateUrl: './kubernetes-aws-auth-form.component.html',
  styleUrls: ['./kubernetes-aws-auth-form.component.scss']
})
export class KubernetesAWSAuthFormComponent implements IAuthForm {
  @Input() formGroup: FormGroup;
}
