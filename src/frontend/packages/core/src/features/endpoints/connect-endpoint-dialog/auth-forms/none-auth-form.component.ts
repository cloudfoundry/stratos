import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { IAuthForm } from '@stratosui/store';

/**
 * Type definition for the None Auth Form
 * No fields are required as this auth type requires no user input
 */
export type NoneAuthFormValue = Record<string, never>;

@Component({
  selector: 'app-none-auth-form',
  templateUrl: './none-auth-form.component.html',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NoneAuthFormComponent implements IAuthForm {
  readonly formGroup = input.required<FormGroup<NoneAuthFormValue>>();
}
