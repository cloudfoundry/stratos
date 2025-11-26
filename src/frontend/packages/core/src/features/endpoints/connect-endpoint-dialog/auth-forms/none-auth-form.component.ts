import { ChangeDetectionStrategy, Component, Input  } from '@angular/core';
import type { FormGroup } from '@angular/forms';
import type { IAuthForm } from '@stratosui/store';

/**
 * Type definition for the None Auth Form
 * No fields are required as this auth type requires no user input
 */
export type NoneAuthFormValue = {}

@Component({
  selector: 'app-none-auth-form',
  templateUrl: './none-auth-form.component.html',
  styleUrls: ['./none-auth-form.component.scss'],
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NoneAuthFormComponent implements IAuthForm {
  @Input() formGroup!: FormGroup<NoneAuthFormValue>;
}
