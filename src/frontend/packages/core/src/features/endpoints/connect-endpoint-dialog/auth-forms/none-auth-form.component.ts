import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { IAuthForm } from '../../../../../../store/src/extension-types';

@Component({
  selector: 'app-none-auth-form',
  templateUrl: './none-auth-form.component.html',
  styleUrls: ['./none-auth-form.component.scss']
})
export class NoneAuthFormComponent implements IAuthForm {
  @Input() formGroup: FormGroup;
}
