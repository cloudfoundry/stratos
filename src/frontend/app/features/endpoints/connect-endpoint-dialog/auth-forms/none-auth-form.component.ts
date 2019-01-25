import { Component, Input } from '@angular/core';
import { IAuthForm } from '../../../../core/extension/extension-types';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-none-auth-form',
  templateUrl: './none-auth-form.component.html',
  styleUrls: ['./none-auth-form.component.scss']
})
export class NoneAuthFormComponent implements IAuthForm {
  @Input() formGroup: FormGroup;
 }
