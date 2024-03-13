import { Component, Input } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { IAuthForm } from '@stratosui/store';

@Component({
  selector: 'app-none-auth-form',
  templateUrl: './none-auth-form.component.html',
  styleUrls: ['./none-auth-form.component.scss']
})
export class NoneAuthFormComponent implements IAuthForm {
  @Input() formGroup: UntypedFormGroup;
}
